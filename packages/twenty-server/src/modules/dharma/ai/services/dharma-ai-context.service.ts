import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';
import { DharmaCollaboratorPayoutRecord } from 'src/modules/dharma/finance/types/dharma-finance.types';
import {
  DharmaAiContext,
  DharmaProjectRecord,
  PersonRecord,
  STALE_FOLLOWUP_DAYS,
} from 'src/modules/dharma/ai/types/dharma-ai.types';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
const CONTEXT_TTL_MS = 60_000; // 1 minute — short cache to avoid hammering during a single CLI/orchestrator run
const MAX_RECENT_MEMORIES = 20;

@Injectable()
export class DharmaAiContextService {
  private readonly logger = new Logger(DharmaAiContextService.name);

  private readonly cache = new Map<
    string,
    { context: DharmaAiContext; expiresAt: number }
  >();

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly financeKpiService: DharmaFinanceKpiService,
    private readonly memoryService: DharmaAiMemoryService,
  ) {}

  async snapshot({
    workspaceId,
    bypassCache = false,
  }: {
    workspaceId: string;
    bypassCache?: boolean;
  }): Promise<DharmaAiContext> {
    if (!bypassCache) {
      const cached = this.cache.get(workspaceId);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.context;
      }
    }

    const [projects, people, payouts, kpi, recentMemories] = await Promise.all([
      this.twentyORMGlobalManager
        .getRepository<DharmaProjectRecord>(workspaceId, 'dharmaProject', {
          shouldBypassPermissionChecks: true,
        })
        .then((repo) => repo.find()),

      this.twentyORMGlobalManager
        .getRepository<PersonRecord>(workspaceId, 'person', {
          shouldBypassPermissionChecks: true,
        })
        .then((repo) => repo.find()),

      this.twentyORMGlobalManager
        .getRepository<DharmaCollaboratorPayoutRecord>(
          workspaceId,
          'dharmaCollaboratorPayout',
          { shouldBypassPermissionChecks: true },
        )
        .then((repo) => repo.find()),

      this.financeKpiService.computeKpi({ workspaceId }),

      this.memoryService.findRecent({
        workspaceId,
        limit: MAX_RECENT_MEMORIES,
      }),
    ]);

    const activeProjects = projects.filter(
      (project) => project.status === 'ACTIVE' || project.status === 'DRAFT',
    );

    const blockedProjects = projects.filter(
      (project) => project.status === 'BLOCKED',
    );

    const now = Date.now();
    const overdueProjects = projects.filter((project) => {
      if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
        return false;
      }

      if (!project.endDate) {
        return false;
      }

      return new Date(project.endDate).getTime() < now;
    });

    const clientPeople = people.filter(
      (person) => person.dharmaEntityType === 'CLIENT',
    );

    const followUpThreshold = now - STALE_FOLLOWUP_DAYS * MILLIS_PER_DAY;
    const staleFollowUps = clientPeople.filter((person) => {
      if (!person.updatedAt) {
        return true;
      }

      return new Date(person.updatedAt).getTime() < followUpThreshold;
    });

    const pendingPayoutsMicros = payouts
      .filter((payout) => payout.status === 'PENDING')
      .reduce(
        (acc, payout) => acc + Number(payout.feeAmount?.amountMicros ?? 0),
        0,
      );

    const context: DharmaAiContext = {
      workspaceId,
      generatedAt: new Date().toISOString(),
      finance: {
        period: kpi.period,
        grossIncome: kpi.grossIncome,
        blAvailable: kpi.blAvailable,
        taxCassetto: kpi.taxCassetto,
        pendingPayouts: pendingPayoutsMicros / 1_000_000,
      },
      projects: {
        activeCount: activeProjects.length,
        blockedCount: blockedProjects.length,
        overdueCount: overdueProjects.length,
      },
      contacts: {
        totalActive: clientPeople.length,
        staleFollowUpCount: staleFollowUps.length,
      },
      recentMemories,
    };

    this.cache.set(workspaceId, {
      context,
      expiresAt: Date.now() + CONTEXT_TTL_MS,
    });

    this.logger.log(
      `Context snapshot built for workspace ${workspaceId} (memories: ${recentMemories.length})`,
    );

    return context;
  }

  invalidate({ workspaceId }: { workspaceId: string }): void {
    this.cache.delete(workspaceId);
  }
}

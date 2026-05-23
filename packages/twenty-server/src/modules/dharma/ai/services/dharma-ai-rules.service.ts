import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';
import {
  DharmaCollaboratorPayoutRecord,
  DharmaIncomeEntryRecord,
} from 'src/modules/dharma/finance/types/dharma-finance.types';
import {
  DharmaAiSignal,
  DharmaProjectRecord,
  PersonRecord,
  SCORE_CRITICAL,
  SCORE_HIGH,
  SCORE_MEDIUM,
  STALE_FOLLOWUP_DAYS,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class DharmaAiRulesService {
  private readonly logger = new Logger(DharmaAiRulesService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly financeKpiService: DharmaFinanceKpiService,
  ) {}

  async evaluate({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<DharmaAiSignal[]> {
    const signals: DharmaAiSignal[] = [];

    const [projects, people, payouts, incomeEntries, kpi] = await Promise.all([
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

      this.twentyORMGlobalManager
        .getRepository<DharmaIncomeEntryRecord>(workspaceId, 'dharmaIncomeEntry', {
          shouldBypassPermissionChecks: true,
        })
        .then((repo) => repo.find()),

      this.financeKpiService.computeKpi({ workspaceId }),
    ]);

    signals.push(...this.evaluateOverdueProjects(projects));
    signals.push(...this.evaluateStaleFollowUps(people));
    signals.push(...this.evaluatePendingPayouts(payouts, kpi.blAvailable));
    signals.push(...this.evaluateRevenueAlerts(incomeEntries));
    signals.push(...this.evaluateCassettoExhaustion(kpi.blAvailable));

    this.logger.log(
      `Rules engine produced ${signals.length} signals for workspace ${workspaceId}`,
    );

    return signals;
  }

  private evaluateOverdueProjects(
    projects: DharmaProjectRecord[],
  ): DharmaAiSignal[] {
    const now = Date.now();

    return projects
      .filter((project) => {
        if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
          return false;
        }

        if (!project.endDate) {
          return false;
        }

        return new Date(project.endDate).getTime() < now;
      })
      .map((project) => ({
        kind: 'TASK_PRIORITY' as const,
        title: `Project overdue: ${project.name ?? project.id}`,
        body: `Project end date ${project.endDate} has passed but status is "${project.status ?? 'unknown'}". Close it or extend the deadline.`,
        payload: { projectId: project.id, endDate: project.endDate },
        score: SCORE_HIGH,
        source: 'RULES' as const,
      }));
  }

  private evaluateStaleFollowUps(people: PersonRecord[]): DharmaAiSignal[] {
    const threshold = Date.now() - STALE_FOLLOWUP_DAYS * MILLIS_PER_DAY;

    return people
      .filter((person) => {
        if (person.dharmaEntityType !== 'CLIENT') {
          return false;
        }

        if (!person.updatedAt) {
          return true;
        }

        return new Date(person.updatedAt).getTime() < threshold;
      })
      .map((person) => {
        const personName = [person.name?.firstName, person.name?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || person.id;

        const isHighPriority = person.dharmaPriority === 'HIGH';

        return {
          kind: 'FOLLOWUP' as const,
          title: `Stale contact: ${personName}`,
          body: `No activity for over ${STALE_FOLLOWUP_DAYS} days. Reach out to keep relationship warm.`,
          payload: {
            personId: person.id,
            lastTouched: person.updatedAt,
            priority: person.dharmaPriority,
          },
          score: isHighPriority ? SCORE_HIGH : SCORE_MEDIUM,
          source: 'RULES' as const,
        };
      });
  }

  private evaluatePendingPayouts(
    payouts: DharmaCollaboratorPayoutRecord[],
    blAvailable: number,
  ): DharmaAiSignal[] {
    const pendingPayoutsMicros = payouts
      .filter((payout) => payout.status === 'PENDING')
      .reduce(
        (acc, payout) => acc + Number(payout.feeAmount?.amountMicros ?? 0),
        0,
      );

    const pendingPayouts = pendingPayoutsMicros / 1_000_000;

    if (pendingPayouts === 0) {
      return [];
    }

    const insufficientBl = pendingPayouts > blAvailable;

    return [
      {
        kind: 'PAYMENT' as const,
        title: insufficientBl
          ? `Collaborator payouts exceed BL cassetto`
          : `Pending collaborator payouts: € ${pendingPayouts.toFixed(2)}`,
        body: insufficientBl
          ? `BL cassetto has € ${blAvailable.toFixed(2)} but € ${pendingPayouts.toFixed(2)} in payouts are pending. Postpone payouts or move funds.`
          : `${payouts.filter((payout) => payout.status === 'PENDING').length} payouts pending. BL cassetto covers the amount.`,
        payload: { pendingPayouts, blAvailable, insufficientBl },
        score: insufficientBl ? SCORE_CRITICAL : SCORE_MEDIUM,
        source: 'RULES' as const,
      },
    ];
  }

  private evaluateRevenueAlerts(
    incomeEntries: DharmaIncomeEntryRecord[],
  ): DharmaAiSignal[] {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthMicros = incomeEntries
      .filter((entry) => {
        if (!entry.receivedAt) {
          return false;
        }

        const date = new Date(entry.receivedAt);

        return (
          date.getFullYear() === currentYear && date.getMonth() === currentMonth
        );
      })
      .reduce(
        (acc, entry) => acc + Number(entry.grossAmount?.amountMicros ?? 0),
        0,
      );

    const currentMonthRevenue = currentMonthMicros / 1_000_000;

    if (currentMonthRevenue === 0 && new Date().getDate() > 15) {
      return [
        {
          kind: 'REVENUE_ALERT' as const,
          title: 'No revenue this month',
          body: `No income recorded this month past the 15th. Review pipeline and outstanding quotes.`,
          payload: { currentMonthRevenue, day: new Date().getDate() },
          score: SCORE_HIGH,
          source: 'RULES' as const,
        },
      ];
    }

    return [];
  }

  private evaluateCassettoExhaustion(blAvailable: number): DharmaAiSignal[] {
    if (blAvailable >= 0) {
      return [];
    }

    return [
      {
        kind: 'PAYMENT' as const,
        title: 'BL cassetto is negative',
        body: `Beautiful Life cassetto sits at € ${blAvailable.toFixed(2)}. Payouts have outpaced invoiced revenue. Adjust splits or recover funds from personale.`,
        payload: { blAvailable },
        score: SCORE_CRITICAL,
        source: 'RULES' as const,
      },
    ];
  }
}

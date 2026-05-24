import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaSplitEngineService } from 'src/modules/dharma/finance/services/dharma-split-engine.service';
import { DharmaBielleCrmSourceService } from 'src/modules/dharma/migration/services/dharma-biellecrm-source.service';
import { DharmaMigrationMapperService } from 'src/modules/dharma/migration/services/dharma-migration-mapper.service';
import {
  DharmaMigrationEntity,
  DharmaMigrationOptions,
  DharmaMigrationStats,
} from 'src/modules/dharma/migration/types/dharma-migration.types';

type LegacyMap = Map<string, string>;

@Injectable()
export class DharmaMigrationService {
  private readonly logger = new Logger(DharmaMigrationService.name);

  constructor(
    private readonly source: DharmaBielleCrmSourceService,
    private readonly mapper: DharmaMigrationMapperService,
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly splitEngine: DharmaSplitEngineService,
  ) {}

  async run(options: DharmaMigrationOptions): Promise<DharmaMigrationStats[]> {
    const stats: DharmaMigrationStats[] = [];

    await this.source.withClient(options.sourceUrl, async (client) => {
      const companyByLegacy: LegacyMap = new Map();
      const projectByLegacy: LegacyMap = new Map();

      if (options.entities.includes('company')) {
        stats.push(
          await this.migrateCompanies(client, options, companyByLegacy),
        );
      } else {
        await this.preloadCompanyMap(options.workspaceId, companyByLegacy);
      }

      if (options.entities.includes('person')) {
        stats.push(await this.migratePersons(client, options, companyByLegacy));
      }

      if (options.entities.includes('project')) {
        stats.push(
          await this.migrateProjects(
            client,
            options,
            companyByLegacy,
            projectByLegacy,
          ),
        );
      } else {
        await this.preloadProjectMap(options.workspaceId, projectByLegacy);
      }

      if (options.entities.includes('income')) {
        stats.push(await this.migrateIncome(client, options, projectByLegacy));
      }

      if (options.entities.includes('expense')) {
        stats.push(await this.migrateExpense(client, options, projectByLegacy));
      }
    });

    return stats;
  }

  private async preloadCompanyMap(
    workspaceId: string,
    map: LegacyMap,
  ): Promise<void> {
    const repo = await this.twentyORMGlobalManager.getRepository<{
      id: string;
      dharmaLegacyId: string | null;
    }>(workspaceId, 'company', { shouldBypassPermissionChecks: true });
    const rows = await repo.find();
    for (const row of rows) {
      if (row.dharmaLegacyId) map.set(row.dharmaLegacyId, row.id);
    }
  }

  private async preloadProjectMap(
    workspaceId: string,
    map: LegacyMap,
  ): Promise<void> {
    const repo = await this.twentyORMGlobalManager.getRepository<{
      id: string;
      dharmaLegacyId: string | null;
    }>(workspaceId, 'dharmaProject', { shouldBypassPermissionChecks: true });
    const rows = await repo.find();
    for (const row of rows) {
      if (row.dharmaLegacyId) map.set(row.dharmaLegacyId, row.id);
    }
  }

  private newStats(entity: DharmaMigrationEntity): DharmaMigrationStats {
    return {
      entity,
      read: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };
  }

  private async upsert<T extends { id?: string }>(
    repo: {
      findOne: (opts: { where: Record<string, unknown> }) => Promise<T | null>;
      save: (entity: Partial<T>) => Promise<T>;
    },
    legacyId: string,
    payload: Partial<T>,
    stats: DharmaMigrationStats,
    dryRun: boolean,
  ): Promise<string | null> {
    const existing = await repo.findOne({
      where: { dharmaLegacyId: legacyId },
    });

    if (dryRun) {
      if (existing) stats.updated++;
      else stats.inserted++;
      return existing?.id ?? null;
    }

    if (existing) {
      const saved = await repo.save({
        ...payload,
        id: existing.id,
      } as Partial<T>);
      stats.updated++;
      return saved.id ?? existing.id ?? null;
    }

    const saved = await repo.save(payload);
    stats.inserted++;
    return saved.id ?? null;
  }

  private async migrateCompanies(
    client: import('pg').Client,
    options: DharmaMigrationOptions,
    map: LegacyMap,
  ): Promise<DharmaMigrationStats> {
    const stats = this.newStats('company');
    const rows = await this.source.fetchOrganizations(client, options.since);
    stats.read = rows.length;

    const repo = await this.twentyORMGlobalManager.getRepository<{
      id: string;
      dharmaLegacyId: string | null;
      name: string;
      vatCode: string | null;
      dharmaEntityType: string;
    }>(options.workspaceId, 'company', {
      shouldBypassPermissionChecks: true,
    });

    for (const row of rows) {
      try {
        const payload = this.mapper.mapOrganization(row);
        const id = await this.upsert(
          repo as never,
          row.id,
          payload as never,
          stats,
          options.dryRun,
        );
        if (id) map.set(row.id, id);
      } catch (error) {
        this.logger.error(`[company ${row.id}] ${(error as Error).message}`);
        stats.failed++;
      }
    }
    return stats;
  }

  private async migratePersons(
    client: import('pg').Client,
    options: DharmaMigrationOptions,
    companyMap: LegacyMap,
  ): Promise<DharmaMigrationStats> {
    const stats = this.newStats('person');
    const rows = await this.source.fetchContacts(client, options.since);
    stats.read = rows.length;

    const repo = await this.twentyORMGlobalManager.getRepository(
      options.workspaceId,
      'person',
      { shouldBypassPermissionChecks: true },
    );

    for (const row of rows) {
      try {
        const payload = this.mapper.mapContact(row);
        const companyId = row.company
          ? this.findCompanyByName(companyMap, row.company)
          : null;
        await this.upsert(
          repo as never,
          row.id,
          { ...payload, companyId } as never,
          stats,
          options.dryRun,
        );
      } catch (error) {
        this.logger.error(`[person ${row.id}] ${(error as Error).message}`);
        stats.failed++;
      }
    }
    return stats;
  }

  private findCompanyByName(
    _companyMap: LegacyMap,
    _name: string,
  ): string | null {
    // Best-effort placeholder: BielleCRM Contact.company is a free-text string,
    // not a FK to ClientOrganization. Skipping cross-match to avoid wrong joins.
    // Future: implement fuzzy match against existing companies if needed.
    return null;
  }

  private async migrateProjects(
    client: import('pg').Client,
    options: DharmaMigrationOptions,
    companyMap: LegacyMap,
    projectMap: LegacyMap,
  ): Promise<DharmaMigrationStats> {
    const stats = this.newStats('project');
    const rows = await this.source.fetchProjects(client, options.since);
    stats.read = rows.length;

    const repo = await this.twentyORMGlobalManager.getRepository(
      options.workspaceId,
      'dharmaProject',
      { shouldBypassPermissionChecks: true },
    );

    for (const row of rows) {
      try {
        const companyId = row.clientOrganizationId
          ? (companyMap.get(row.clientOrganizationId) ?? null)
          : null;
        const payload = this.mapper.mapProject(row, companyId);
        const id = await this.upsert(
          repo as never,
          row.id,
          payload as never,
          stats,
          options.dryRun,
        );
        if (id) projectMap.set(row.id, id);
      } catch (error) {
        this.logger.error(`[project ${row.id}] ${(error as Error).message}`);
        stats.failed++;
      }
    }
    return stats;
  }

  private async migrateIncome(
    client: import('pg').Client,
    options: DharmaMigrationOptions,
    projectMap: LegacyMap,
  ): Promise<DharmaMigrationStats> {
    const stats = this.newStats('income');
    const rows = await this.source.fetchAccounting(
      client,
      options.since,
      'INCOME',
    );
    stats.read = rows.length;

    const repo = await this.twentyORMGlobalManager.getRepository(
      options.workspaceId,
      'dharmaIncomeEntry',
      { shouldBypassPermissionChecks: true },
    );

    for (const row of rows) {
      try {
        const projectId = row.projectId
          ? (projectMap.get(row.projectId) ?? null)
          : null;
        const payload = this.mapper.mapIncome(row, projectId);

        const split = this.splitEngine.computeSplit(
          payload.grossAmount.amountMicros,
          payload.incomeType,
          payload.splitConfig,
        );

        const withSplit = {
          ...payload,
          taxAmount: {
            amountMicros: split.taxAmountMicros,
            currencyCode: split.currencyCode,
          },
          beautifulLifeAmount: {
            amountMicros: split.blAmountMicros,
            currencyCode: split.currencyCode,
          },
          personalAmount: {
            amountMicros: split.personalAmountMicros,
            currencyCode: split.currencyCode,
          },
        };

        await this.upsert(
          repo as never,
          row.id,
          withSplit as never,
          stats,
          options.dryRun,
        );
      } catch (error) {
        this.logger.error(`[income ${row.id}] ${(error as Error).message}`);
        stats.failed++;
      }
    }
    return stats;
  }

  private async migrateExpense(
    client: import('pg').Client,
    options: DharmaMigrationOptions,
    projectMap: LegacyMap,
  ): Promise<DharmaMigrationStats> {
    const stats = this.newStats('expense');
    const rows = await this.source.fetchAccounting(
      client,
      options.since,
      'EXPENSE',
    );
    stats.read = rows.length;

    const repo = await this.twentyORMGlobalManager.getRepository(
      options.workspaceId,
      'dharmaExpenseEntry',
      { shouldBypassPermissionChecks: true },
    );

    for (const row of rows) {
      try {
        const projectId = row.projectId
          ? (projectMap.get(row.projectId) ?? null)
          : null;
        const payload = this.mapper.mapExpense(row, projectId);
        await this.upsert(
          repo as never,
          row.id,
          payload as never,
          stats,
          options.dryRun,
        );
      } catch (error) {
        this.logger.error(`[expense ${row.id}] ${(error as Error).message}`);
        stats.failed++;
      }
    }
    return stats;
  }
}

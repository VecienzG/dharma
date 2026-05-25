import { Injectable, Logger } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { DharmaSplitEngineService } from 'src/modules/dharma/finance/services/dharma-split-engine.service';
import {
  DEFAULT_CURRENCY_CODE,
  type DharmaIncomeEntryRecord,
} from 'src/modules/dharma/finance/types/dharma-finance.types';

// Fields whose change should trigger a split recompute. We deliberately exclude
// taxAmount / beautifulLifeAmount / personalAmount so that the recompute write
// itself does not retrigger the listener (recursion guard).
const SPLIT_INPUT_FIELDS = [
  'splitConfig',
  'grossAmount',
  'incomeType',
] as const;

@Injectable()
export class DharmaIncomeEntrySplitListener {
  private readonly logger = new Logger(DharmaIncomeEntrySplitListener.name);

  constructor(
    private readonly splitEngine: DharmaSplitEngineService,
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  @OnDatabaseBatchEvent('dharmaIncomeEntry', DatabaseEventAction.UPDATED)
  async handleUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<DharmaIncomeEntryRecord>
    >,
  ) {
    const eventsToRecompute = payload.events.filter((event) =>
      event.properties.updatedFields?.some((field) =>
        (SPLIT_INPUT_FIELDS as readonly string[]).includes(field),
      ),
    );

    if (eventsToRecompute.length === 0) {
      return;
    }

    await this.recomputeForRecords(
      payload.workspaceId,
      eventsToRecompute.map((event) => event.properties.after),
    );
  }

  @OnDatabaseBatchEvent('dharmaIncomeEntry', DatabaseEventAction.CREATED)
  async handleCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<DharmaIncomeEntryRecord>
    >,
  ) {
    // Only recompute new entries that already carry the inputs needed.
    const records = payload.events
      .map((event) => event.properties.after)
      .filter(
        (record) => !!record?.grossAmount?.amountMicros && !!record.incomeType,
      );

    if (records.length === 0) {
      return;
    }

    await this.recomputeForRecords(payload.workspaceId, records);
  }

  private async recomputeForRecords(
    workspaceId: string,
    records: DharmaIncomeEntryRecord[],
  ) {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaIncomeEntryRecord>(
        workspaceId,
        'dharmaIncomeEntry',
        { shouldBypassPermissionChecks: true },
      );

    for (const record of records) {
      if (
        !record?.id ||
        !record.grossAmount?.amountMicros ||
        !record.incomeType
      ) {
        continue;
      }

      const split = this.splitEngine.computeSplit(
        Number(record.grossAmount.amountMicros),
        record.incomeType,
        record.splitConfig,
      );

      const currencyCode =
        record.grossAmount.currencyCode ?? DEFAULT_CURRENCY_CODE;

      // Skip if the computed values already match — avoids redundant writes
      // (and a second UPDATED event that would just be filtered out anyway).
      const alreadyMatches =
        record.taxAmount?.amountMicros === split.taxAmountMicros &&
        record.beautifulLifeAmount?.amountMicros === split.blAmountMicros &&
        record.personalAmount?.amountMicros === split.personalAmountMicros;

      if (alreadyMatches) {
        continue;
      }

      try {
        await repo.update(record.id, {
          taxAmount: {
            amountMicros: split.taxAmountMicros,
            currencyCode,
          },
          beautifulLifeAmount: {
            amountMicros: split.blAmountMicros,
            currencyCode,
          },
          personalAmount: {
            amountMicros: split.personalAmountMicros,
            currencyCode,
          },
        } as Partial<DharmaIncomeEntryRecord>);
      } catch (error) {
        this.logger.error(
          `Failed to recompute split for income entry ${record.id} in workspace ${workspaceId}`,
          error,
        );
      }
    }
  }
}

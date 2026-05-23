import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  CASH_SPLIT_DEFAULTS,
  CassettiSplit,
  DEFAULT_CURRENCY_CODE,
  DharmaIncomeEntryRecord,
  INVOICED_SPLIT_DEFAULTS,
  SplitConfig,
} from 'src/modules/dharma/finance/types/dharma-finance.types';

@Injectable()
export class DharmaSplitEngineService {
  private readonly logger = new Logger(DharmaSplitEngineService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  computeSplit(
    grossAmountMicros: number,
    incomeType: 'INVOICED' | 'CASH',
    splitConfigOverride: SplitConfig | null,
  ): CassettiSplit {
    const config =
      splitConfigOverride ??
      (incomeType === 'INVOICED' ? INVOICED_SPLIT_DEFAULTS : CASH_SPLIT_DEFAULTS);

    const taxAmountMicros = Math.round(
      (grossAmountMicros * config.taxPercent) / 100,
    );
    const blAmountMicros = Math.round(
      (grossAmountMicros * config.blPercent) / 100,
    );
    // personal is the remainder — guarantees sum == gross with no rounding drift
    const personalAmountMicros =
      grossAmountMicros - taxAmountMicros - blAmountMicros;

    return {
      taxAmountMicros,
      blAmountMicros,
      personalAmountMicros,
      currencyCode: DEFAULT_CURRENCY_CODE,
    };
  }

  async recomputeAllSplits({
    workspaceId,
    dryRun = false,
  }: {
    workspaceId: string;
    dryRun?: boolean;
  }): Promise<{ processed: number; updated: number; skipped: number }> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaIncomeEntryRecord>(
        workspaceId,
        'dharmaIncomeEntry',
        { shouldBypassPermissionChecks: true },
      );

    const entries = await repo.find();

    let updated = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (!entry.grossAmount?.amountMicros || !entry.incomeType) {
        skipped++;
        continue;
      }

      const split = this.computeSplit(
        Number(entry.grossAmount.amountMicros),
        entry.incomeType,
        entry.splitConfig,
      );

      const currencyCode =
        entry.grossAmount.currencyCode ?? DEFAULT_CURRENCY_CODE;

      this.logger.log(
        `[${dryRun ? 'DRY RUN' : 'UPDATE'}] Entry ${entry.id}: gross=${entry.grossAmount.amountMicros} tax=${split.taxAmountMicros} bl=${split.blAmountMicros} personal=${split.personalAmountMicros}`,
      );

      if (!dryRun) {
        await repo.update(entry.id, {
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
      }

      updated++;
    }

    return { processed: entries.length, updated, skipped };
  }
}

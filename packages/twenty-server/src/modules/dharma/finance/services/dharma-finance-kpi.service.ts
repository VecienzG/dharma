import { Injectable, Logger } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DharmaCollaboratorPayoutRecord,
  DharmaExpenseEntryRecord,
  DharmaFinanceKpi,
  DharmaIncomeEntryRecord,
} from 'src/modules/dharma/finance/types/dharma-finance.types';

const MICROS_DIVISOR = 1_000_000;

@Injectable()
export class DharmaFinanceKpiService {
  private readonly logger = new Logger(DharmaFinanceKpiService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  async computeKpi({
    workspaceId,
    year,
    month,
  }: {
    workspaceId: string;
    year?: number;
    month?: number;
  }): Promise<DharmaFinanceKpi> {
    const [incomeEntries, expenseEntries, payouts] = await Promise.all([
      this.twentyORMGlobalManager
        .getRepository<DharmaIncomeEntryRecord>(
          workspaceId,
          'dharmaIncomeEntry',
          { shouldBypassPermissionChecks: true },
        )
        .then((repo) => repo.find()),

      this.twentyORMGlobalManager
        .getRepository<DharmaExpenseEntryRecord>(
          workspaceId,
          'dharmaExpenseEntry',
          { shouldBypassPermissionChecks: true },
        )
        .then((repo) => repo.find()),

      this.twentyORMGlobalManager
        .getRepository<DharmaCollaboratorPayoutRecord>(
          workspaceId,
          'dharmaCollaboratorPayout',
          { shouldBypassPermissionChecks: true },
        )
        .then((repo) => repo.find()),
    ]);

    const filteredIncome = this.filterByPeriod(
      incomeEntries,
      'receivedAt',
      year,
      month,
    );
    const filteredExpenses = this.filterByPeriod(
      expenseEntries,
      'paidAt',
      year,
      month,
    );

    const grossIncomeMicros = this.sumMicros(filteredIncome, 'grossAmount');
    const taxMicros = this.sumMicros(filteredIncome, 'taxAmount');
    const blMicros = this.sumMicros(filteredIncome, 'beautifulLifeAmount');
    const personalMicros = this.sumMicros(filteredIncome, 'personalAmount');
    const expensesMicros = this.sumMicros(filteredExpenses, 'amount');

    const paidPayoutsMicros = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((acc, p) => acc + Number(p.feeAmount?.amountMicros ?? 0), 0);

    const blAvailableMicros = blMicros - paidPayoutsMicros;

    const period = this.formatPeriod(year, month);

    this.logger.log(
      `KPI computed for workspace ${workspaceId} period=${period}`,
    );

    return {
      period,
      grossIncome: grossIncomeMicros / MICROS_DIVISOR,
      taxCassetto: taxMicros / MICROS_DIVISOR,
      blCassetto: blMicros / MICROS_DIVISOR,
      personalCassetto: personalMicros / MICROS_DIVISOR,
      totalExpenses: expensesMicros / MICROS_DIVISOR,
      collaboratorPayouts: paidPayoutsMicros / MICROS_DIVISOR,
      blAvailable: blAvailableMicros / MICROS_DIVISOR,
      netPersonal: personalMicros / MICROS_DIVISOR,
      entryCount: filteredIncome.length,
    };
  }

  private filterByPeriod<TRecord extends Record<string, unknown>>(
    records: TRecord[],
    dateField: keyof TRecord,
    year?: number,
    month?: number,
  ): TRecord[] {
    if (!year) {
      return records;
    }

    return records.filter((record) => {
      const raw = record[dateField];

      if (!raw) {
        return false;
      }

      const date = new Date(raw as string | Date);

      if (isNaN(date.getTime())) {
        return false;
      }

      const matchesYear = date.getFullYear() === year;
      const matchesMonth = !month || date.getMonth() + 1 === month;

      return matchesYear && matchesMonth;
    });
  }

  private sumMicros<TRecord extends Record<string, unknown>>(
    records: TRecord[],
    field: keyof TRecord,
  ): number {
    return records.reduce((acc, record) => {
      const value = record[field] as
        | { amountMicros: number | bigint }
        | null
        | undefined;

      return acc + Number(value?.amountMicros ?? 0);
    }, 0);
  }

  private formatPeriod(year?: number, month?: number): string {
    if (!year) {
      return 'all-time';
    }

    if (!month) {
      return String(year);
    }

    return `${year}-${String(month).padStart(2, '0')}`;
  }
}

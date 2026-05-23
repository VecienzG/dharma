import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';

type DharmaFinanceKpiOptions = {
  workspaceId: string;
  year?: number;
  month?: number;
};

@Command({
  name: 'dharma:finance:kpi',
  description: 'Print finance KPI summary for a workspace and optional period.',
})
export class DharmaFinanceKpiCommand extends CommandRunner {
  private readonly logger = new Logger(DharmaFinanceKpiCommand.name);

  constructor(
    private readonly dharmaFinanceKpiService: DharmaFinanceKpiService,
  ) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Target workspace ID',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '--year <year>',
    description: 'Filter by year (e.g. 2025)',
  })
  parseYear(value: string): number {
    return parseInt(value, 10);
  }

  @Option({
    flags: '--month <month>',
    description: 'Filter by month number 1-12 (requires --year)',
  })
  parseMonth(value: string): number {
    return parseInt(value, 10);
  }

  async run(
    _passedParams: string[],
    options: DharmaFinanceKpiOptions,
  ): Promise<void> {
    try {
      const kpi = await this.dharmaFinanceKpiService.computeKpi({
        workspaceId: options.workspaceId,
        year: options.year,
        month: options.month,
      });

      const fmt = (n: number) =>
        n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

      this.logger.log('──────────────────────────────────────────');
      this.logger.log(`  Dharma Finance KPI — period: ${kpi.period}`);
      this.logger.log('──────────────────────────────────────────');
      this.logger.log(`  Income entries   : ${kpi.entryCount}`);
      this.logger.log(`  Gross income     : ${fmt(kpi.grossIncome)}`);
      this.logger.log('  ── Cassetti split ──────────────────────');
      this.logger.log(`  Tax              : ${fmt(kpi.taxCassetto)}`);
      this.logger.log(`  Beautiful Life   : ${fmt(kpi.blCassetto)}`);
      this.logger.log(`  Personal         : ${fmt(kpi.personalCassetto)}`);
      this.logger.log('  ── BL cassetto ─────────────────────────');
      this.logger.log(`  Collaborator payo: ${fmt(kpi.collaboratorPayouts)}`);
      this.logger.log(`  BL available     : ${fmt(kpi.blAvailable)}`);
      this.logger.log('  ── Expenses ────────────────────────────');
      this.logger.log(`  Total expenses   : ${fmt(kpi.totalExpenses)}`);
      this.logger.log(`  Net personal     : ${fmt(kpi.netPersonal)}`);
      this.logger.log('──────────────────────────────────────────');
    } catch (error) {
      this.logger.error('KPI computation failed:', error);
      this.logger.error(error.stack);
      process.exit(1);
    }
  }
}

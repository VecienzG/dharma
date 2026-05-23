import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { DharmaSplitEngineService } from 'src/modules/dharma/finance/services/dharma-split-engine.service';

type DharmaRecomputeSplitsOptions = {
  workspaceId: string;
  dryRun: boolean;
};

@Command({
  name: 'dharma:finance:recompute-splits',
  description:
    'Recompute cassetti split amounts for all dharmaIncomeEntry records. Run after dharma:seed:schema.',
})
export class DharmaFinanceRecomputeSplitsCommand extends CommandRunner {
  private readonly logger = new Logger(
    DharmaFinanceRecomputeSplitsCommand.name,
  );

  constructor(
    private readonly dharmaSplitEngineService: DharmaSplitEngineService,
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
    flags: '--dry-run',
    description: 'Log computed splits without writing to database',
  })
  parseDryRun(): boolean {
    return true;
  }

  async run(
    _passedParams: string[],
    options: DharmaRecomputeSplitsOptions,
  ): Promise<void> {
    const dryRun = options.dryRun ?? false;

    try {
      const result =
        await this.dharmaSplitEngineService.recomputeAllSplits({
          workspaceId: options.workspaceId,
          dryRun,
        });

      this.logger.log(
        `Done. processed=${result.processed} updated=${result.updated} skipped=${result.skipped}${dryRun ? ' (dry run)' : ''}`,
      );
    } catch (error) {
      this.logger.error('Recompute splits failed:', error);
      this.logger.error(error.stack);
      process.exit(1);
    }
  }
}

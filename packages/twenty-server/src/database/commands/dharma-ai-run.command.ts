import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { DharmaAiOrchestratorService } from 'src/modules/dharma/ai/services/dharma-ai-orchestrator.service';

type DharmaAiRunOptions = {
  workspaceId: string;
  reasoning?: boolean;
  rulesOnly?: boolean;
};

@Command({
  name: 'dharma:ai:run',
  description:
    'Run the Dharma AI orchestrator: evaluate rules + context + memory, optionally call LLM, persist suggestions.',
})
export class DharmaAiRunCommand extends CommandRunner {
  private readonly logger = new Logger(DharmaAiRunCommand.name);

  constructor(
    private readonly orchestrator: DharmaAiOrchestratorService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
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
    flags: '--reasoning',
    description:
      'Use the reasoning model (Sonnet 4.6) instead of the default (Haiku 4.5)',
  })
  parseReasoning(): boolean {
    return true;
  }

  @Option({
    flags: '--rules-only',
    description:
      'Skip LLM step, persist only deterministic signals from the rules engine',
  })
  parseRulesOnly(): boolean {
    return true;
  }

  async run(
    _passedParams: string[],
    options: DharmaAiRunOptions,
  ): Promise<void> {
    try {
      const authContext = buildSystemAuthContext(options.workspaceId);

      const result =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          () =>
            this.orchestrator.run({
              workspaceId: options.workspaceId,
              useReasoningModel: options.reasoning ?? false,
              rulesOnly: options.rulesOnly ?? false,
            }),
          authContext,
        );

      this.logger.log('──────────────────────────────────────────');
      this.logger.log('  Dharma AI run complete');
      this.logger.log('──────────────────────────────────────────');
      this.logger.log(`  Rules signals     : ${result.rulesSignalsCount}`);
      this.logger.log(`  LLM signals       : ${result.llmSignalsCount}`);
      this.logger.log(
        `  Persisted         : ${result.persistedSuggestionIds.length}`,
      );
      this.logger.log(
        `  Notifications     : ${result.notificationsDispatched}`,
      );
      this.logger.log(`  Model             : ${result.modelUsed}`);
      this.logger.log('──────────────────────────────────────────');
    } catch (error) {
      this.logger.error('AI run failed:', error);

      if (error instanceof Error && error.stack) {
        this.logger.error(error.stack);
      }

      process.exit(1);
    }
  }
}

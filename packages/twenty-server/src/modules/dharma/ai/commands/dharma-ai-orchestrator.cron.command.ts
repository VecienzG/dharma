import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { DHARMA_AI_ORCHESTRATOR_CRON_PATTERN } from 'src/modules/dharma/ai/constants/dharma-ai-cron-pattern.constant';
import { DharmaAiOrchestratorCronJob } from 'src/modules/dharma/ai/crons/dharma-ai-orchestrator.cron.job';

@Command({
  name: 'cron:dharma:ai-orchestrator',
  description:
    'Schedules the Dharma AI orchestrator cron — runs once per hour across all active workspaces.',
})
export class DharmaAiOrchestratorCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: DharmaAiOrchestratorCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: DHARMA_AI_ORCHESTRATOR_CRON_PATTERN,
        },
      },
    });
  }
}

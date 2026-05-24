import { Injectable, Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { DharmaAiOrchestratorService } from 'src/modules/dharma/ai/services/dharma-ai-orchestrator.service';

export type DharmaAiOrchestratorJobData = {
  workspaceId: string;
  useReasoningModel?: boolean;
  rulesOnly?: boolean;
};

@Injectable()
@Processor(MessageQueue.workspaceQueue)
export class DharmaAiOrchestratorJob {
  private readonly logger = new Logger(DharmaAiOrchestratorJob.name);

  constructor(
    private readonly orchestrator: DharmaAiOrchestratorService,
  ) {}

  @Process(DharmaAiOrchestratorJob.name)
  async handle(data: DharmaAiOrchestratorJobData): Promise<void> {
    try {
      await this.orchestrator.run({
        workspaceId: data.workspaceId,
        useReasoningModel: data.useReasoningModel,
        rulesOnly: data.rulesOnly,
      });
    } catch (error) {
      this.logger.error(
        `AI orchestrator job failed for workspace ${data.workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}

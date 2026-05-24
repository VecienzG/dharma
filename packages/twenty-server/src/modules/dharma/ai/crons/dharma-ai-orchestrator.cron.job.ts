import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DHARMA_AI_ORCHESTRATOR_CRON_PATTERN } from 'src/modules/dharma/ai/constants/dharma-ai-cron-pattern.constant';
import {
  DharmaAiOrchestratorJob,
  type DharmaAiOrchestratorJobData,
} from 'src/modules/dharma/ai/jobs/dharma-ai-orchestrator.job';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class DharmaAiOrchestratorCronJob {
  private readonly logger = new Logger(DharmaAiOrchestratorCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(DharmaAiOrchestratorCronJob.name)
  @SentryCronMonitor(
    DharmaAiOrchestratorCronJob.name,
    DHARMA_AI_ORCHESTRATOR_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
      order: { id: 'ASC' },
    });

    if (workspaces.length === 0) {
      this.logger.log('No active workspaces — skip AI orchestrator dispatch');

      return;
    }

    this.logger.log(
      `Enqueuing AI orchestrator runs for ${workspaces.length} workspace(s)`,
    );

    for (const workspace of workspaces) {
      try {
        await this.messageQueueService.add<DharmaAiOrchestratorJobData>(
          DharmaAiOrchestratorJob.name,
          { workspaceId: workspace.id },
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: { id: workspace.id },
        });
      }
    }
  }
}

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
import { DHARMA_NOTIFICATION_SCHEDULER_CRON_PATTERN } from 'src/modules/dharma/notifications/constants/dharma-notification-cron-pattern.constant';
import {
  DharmaNotificationSchedulerJob,
  type DharmaNotificationSchedulerJobData,
} from 'src/modules/dharma/notifications/jobs/dharma-notification-scheduler.job';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class DharmaNotificationSchedulerCronJob {
  private readonly logger = new Logger(DharmaNotificationSchedulerCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(DharmaNotificationSchedulerCronJob.name)
  @SentryCronMonitor(
    DharmaNotificationSchedulerCronJob.name,
    DHARMA_NOTIFICATION_SCHEDULER_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
      order: { id: 'ASC' },
    });

    for (const workspace of workspaces) {
      try {
        await this.messageQueueService.add<DharmaNotificationSchedulerJobData>(
          DharmaNotificationSchedulerJob.name,
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

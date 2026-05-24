import { Injectable, Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { DharmaNotificationSchedulerService } from 'src/modules/dharma/notifications/services/dharma-notification-scheduler.service';

export type DharmaNotificationSchedulerJobData = {
  workspaceId: string;
};

@Injectable()
@Processor(MessageQueue.workspaceQueue)
export class DharmaNotificationSchedulerJob {
  private readonly logger = new Logger(DharmaNotificationSchedulerJob.name);

  constructor(
    private readonly scheduler: DharmaNotificationSchedulerService,
  ) {}

  @Process(DharmaNotificationSchedulerJob.name)
  async handle(data: DharmaNotificationSchedulerJobData): Promise<void> {
    try {
      await this.scheduler.drainDueNotifications({
        workspaceId: data.workspaceId,
      });
    } catch (error) {
      this.logger.error(
        `Notification scheduler job failed for workspace ${data.workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}

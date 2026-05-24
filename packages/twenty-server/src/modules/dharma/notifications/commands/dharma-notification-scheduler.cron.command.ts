import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { DHARMA_NOTIFICATION_SCHEDULER_CRON_PATTERN } from 'src/modules/dharma/notifications/constants/dharma-notification-cron-pattern.constant';
import { DharmaNotificationSchedulerCronJob } from 'src/modules/dharma/notifications/crons/dharma-notification-scheduler.cron.job';

@Command({
  name: 'cron:dharma:notification-scheduler',
  description:
    'Schedules the Dharma notification scheduler cron — drains PENDING notifications whose scheduledAt has passed.',
})
export class DharmaNotificationSchedulerCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: DharmaNotificationSchedulerCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: DHARMA_NOTIFICATION_SCHEDULER_CRON_PATTERN,
        },
      },
    });
  }
}

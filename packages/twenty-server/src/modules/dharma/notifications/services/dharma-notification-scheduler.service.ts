import { Injectable, Logger } from '@nestjs/common';
import { LessThanOrEqual } from 'typeorm';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaNotificationsDispatcherService } from 'src/modules/dharma/notifications/services/dharma-notifications-dispatcher.service';
import {
  type DharmaNotificationChannel,
  type DharmaNotificationRecord,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

@Injectable()
export class DharmaNotificationSchedulerService {
  private readonly logger = new Logger(DharmaNotificationSchedulerService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly dispatcher: DharmaNotificationsDispatcherService,
  ) {}

  // Pull PENDING rows whose scheduledAt has passed and attempt delivery.
  // Designed to be invoked by a cron job — idempotent (in-flight rows get flipped to SENT/FAILED).
  async drainDueNotifications({
    workspaceId,
    batchSize = 50,
  }: {
    workspaceId: string;
    batchSize?: number;
  }): Promise<{ processed: number; sent: number; failed: number }> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaNotificationRecord>(
        workspaceId,
        'dharmaNotification',
        { shouldBypassPermissionChecks: true },
      );

    const due = await repo.find({
      where: {
        status: 'PENDING',
        scheduledAt: LessThanOrEqual(new Date()),
      },
      order: { scheduledAt: 'ASC' },
      take: batchSize,
    });

    if (due.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const row of due) {
      if (!row.channel) {
        await repo.update(
          { id: row.id },
          {
            status: 'FAILED',
            errorMessage: 'Notification has no channel — cannot dispatch',
          },
        );
        failed += 1;
        continue;
      }

      const result = await this.dispatcher.dispatch(
        row.channel as DharmaNotificationChannel,
        {
          recipient: row.recipient ?? '',
          title: row.title ?? '',
          body: row.body ?? '',
          payload: row.payload ?? undefined,
        },
      );

      await repo.update(
        { id: row.id },
        {
          status: result.status,
          errorMessage:
            result.status !== 'SENT' ? result.errorMessage : null,
          providerMessageId:
            result.status === 'SENT'
              ? (result.providerMessageId ?? null)
              : null,
          sentAt: result.status === 'SENT' ? new Date() : null,
        },
      );

      if (result.status === 'SENT') sent += 1;
      else failed += 1;
    }

    this.logger.log(
      `Drained ${due.length} due notifications for workspace=${workspaceId} (sent=${sent} failed=${failed})`,
    );

    return { processed: due.length, sent, failed };
  }
}

import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaNotificationPreferencesService } from 'src/modules/dharma/notifications/services/dharma-notification-preferences.service';
import { DharmaNotificationsDispatcherService } from 'src/modules/dharma/notifications/services/dharma-notifications-dispatcher.service';
import {
  DharmaNotificationChannel,
  DharmaNotificationRecord,
  DharmaNotificationRequest,
  DharmaNotificationStatus,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

type EnqueueResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  notificationIds: string[];
};

@Injectable()
export class DharmaNotificationsService {
  private readonly logger = new Logger(DharmaNotificationsService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly preferences: DharmaNotificationPreferencesService,
    private readonly dispatcher: DharmaNotificationsDispatcherService,
  ) {}

  async send({
    workspaceId,
    request,
  }: {
    workspaceId: string;
    request: DharmaNotificationRequest;
  }): Promise<EnqueueResult> {
    const destinations = await this.preferences.resolveDestinations({
      workspaceId,
      kind: request.kind,
      tags: request.tags ?? [],
      score: request.score,
      workspaceMemberId: request.workspaceMemberId,
      channel: request.channel,
    });

    if (destinations.length === 0) {
      this.logger.log(
        `No matching destinations for kind=${request.kind} workspace=${workspaceId}`,
      );

      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        notificationIds: [],
      };
    }

    const result: EnqueueResult = {
      attempted: destinations.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      notificationIds: [],
    };

    for (const pref of destinations) {
      if (!isDefined(pref.channel)) {
        continue;
      }

      const notificationId = await this.persistPending({
        workspaceId,
        request,
        channel: pref.channel,
        recipient: pref.endpoint,
        workspaceMemberId: pref.workspaceMemberId,
      });

      result.notificationIds.push(notificationId);

      const driverResult = await this.dispatcher.dispatch(pref.channel, {
        recipient: pref.endpoint ?? '',
        title: request.title,
        body: request.body,
        payload: request.payload,
        config: pref.config ?? undefined,
      });

      await this.persistResult({
        workspaceId,
        notificationId,
        status: driverResult.status,
        errorMessage:
          driverResult.status !== 'SENT' ? driverResult.errorMessage : null,
        providerMessageId:
          driverResult.status === 'SENT'
            ? driverResult.providerMessageId ?? null
            : null,
      });

      if (driverResult.status === 'SENT') {
        result.sent += 1;
      } else if (driverResult.status === 'SKIPPED') {
        result.skipped += 1;
      } else {
        result.failed += 1;
      }
    }

    this.logger.log(
      `Notification dispatch: workspace=${workspaceId} kind=${request.kind} sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`,
    );

    return result;
  }

  private async persistPending({
    workspaceId,
    request,
    channel,
    recipient,
    workspaceMemberId,
  }: {
    workspaceId: string;
    request: DharmaNotificationRequest;
    channel: DharmaNotificationChannel;
    recipient: string | null;
    workspaceMemberId: string | null;
  }): Promise<string> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaNotificationRecord>(
      workspaceId,
      'dharmaNotification',
      { shouldBypassPermissionChecks: true },
    );

    const now = new Date();

    const saved = await repo.save({
      channel,
      kind: request.kind,
      title: request.title,
      body: request.body,
      tags: request.tags ?? [],
      payload: request.payload ?? {},
      recipient,
      status: 'PENDING' as const,
      scheduledAt: now,
      sourceKind: request.sourceKind,
      sourceRecordId: request.sourceRecordId ?? null,
      workspaceMemberId: workspaceMemberId ?? null,
      aiSuggestionId:
        request.sourceKind === 'AI' ? request.sourceRecordId ?? null : null,
    });

    const persisted = Array.isArray(saved) ? saved[0] : saved;
    const record = persisted as DharmaNotificationRecord;

    if (!record.id) {
      throw new Error('Failed to persist dharmaNotification — missing id');
    }

    return record.id;
  }

  private async persistResult({
    workspaceId,
    notificationId,
    status,
    errorMessage,
    providerMessageId,
  }: {
    workspaceId: string;
    notificationId: string;
    status: DharmaNotificationStatus;
    errorMessage: string | null;
    providerMessageId: string | null;
  }): Promise<void> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaNotificationRecord>(
      workspaceId,
      'dharmaNotification',
      { shouldBypassPermissionChecks: true },
    );

    await repo.update(
      { id: notificationId },
      {
        status,
        errorMessage,
        providerMessageId,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    );
  }
}

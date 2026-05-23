import { Injectable, Logger } from '@nestjs/common';

import webPush, { type PushSubscription } from 'web-push';

import {
  DharmaDriverPayload,
  DharmaDriverResult,
  DharmaNotificationChannel,
  DharmaNotificationDriver,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

@Injectable()
export class WebPushDriver implements DharmaNotificationDriver {
  readonly channel: DharmaNotificationChannel = 'WEB_PUSH';

  private readonly logger = new Logger(WebPushDriver.name);
  private vapidConfigured = false;

  isConfigured(): boolean {
    return Boolean(
      process.env.VAPID_PUBLIC_KEY &&
        process.env.VAPID_PRIVATE_KEY &&
        process.env.VAPID_SUBJECT,
    );
  }

  async send(payload: DharmaDriverPayload): Promise<DharmaDriverResult> {
    if (!this.isConfigured()) {
      return {
        status: 'SKIPPED',
        errorMessage: 'VAPID keys not set (VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT)',
      };
    }

    this.ensureVapidConfigured();

    const subscription = this.resolveSubscription(payload);

    if (!subscription) {
      return {
        status: 'SKIPPED',
        errorMessage:
          'Missing web push subscription (preference.config.subscription)',
      };
    }

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      data: payload.payload ?? {},
    });

    try {
      const result = await webPush.sendNotification(subscription, message);

      return {
        status: 'SENT',
        providerMessageId: String(result.statusCode),
      };
    } catch (error) {
      const isGoneError =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 410;

      const message = error instanceof Error ? error.message : String(error);

      if (isGoneError) {
        // Subscription expired — caller should clean up the preference row
        return {
          status: 'FAILED',
          errorMessage: `Subscription gone (410): ${message}`,
        };
      }

      this.logger.error(`Web push send failed: ${message}`);

      return { status: 'FAILED', errorMessage: message };
    }
  }

  private ensureVapidConfigured(): void {
    if (this.vapidConfigured) {
      return;
    }

    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT as string,
      process.env.VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string,
    );

    this.vapidConfigured = true;
  }

  private resolveSubscription(
    payload: DharmaDriverPayload,
  ): PushSubscription | null {
    const subscription = payload.config?.subscription;

    if (!subscription || typeof subscription !== 'object') {
      return null;
    }

    const candidate = subscription as Partial<PushSubscription>;

    if (
      typeof candidate.endpoint !== 'string' ||
      !candidate.keys ||
      typeof candidate.keys.p256dh !== 'string' ||
      typeof candidate.keys.auth !== 'string'
    ) {
      return null;
    }

    return {
      endpoint: candidate.endpoint,
      keys: { p256dh: candidate.keys.p256dh, auth: candidate.keys.auth },
    };
  }
}

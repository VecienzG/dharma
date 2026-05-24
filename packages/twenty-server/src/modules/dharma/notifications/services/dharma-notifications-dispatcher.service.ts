import { Injectable, Logger } from '@nestjs/common';

import {
  DharmaDriverPayload,
  DharmaDriverResult,
  DharmaNotificationChannel,
  DharmaNotificationDriver,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';
import { ResendEmailDriver } from 'src/modules/dharma/notifications/drivers/resend-email.driver';
import { TelegramDriver } from 'src/modules/dharma/notifications/drivers/telegram.driver';
import { WebPushDriver } from 'src/modules/dharma/notifications/drivers/web-push.driver';

@Injectable()
export class DharmaNotificationsDispatcherService {
  private readonly logger = new Logger(
    DharmaNotificationsDispatcherService.name,
  );
  private readonly registry: Map<
    DharmaNotificationChannel,
    DharmaNotificationDriver
  >;

  constructor(
    private readonly resendDriver: ResendEmailDriver,
    private readonly webPushDriver: WebPushDriver,
    private readonly telegramDriver: TelegramDriver,
  ) {
    this.registry = new Map<
      DharmaNotificationChannel,
      DharmaNotificationDriver
    >([
      ['EMAIL', this.resendDriver],
      ['WEB_PUSH', this.webPushDriver],
      ['TELEGRAM', this.telegramDriver],
    ]);
  }

  async dispatch(
    channel: DharmaNotificationChannel,
    payload: DharmaDriverPayload,
  ): Promise<DharmaDriverResult> {
    const driver = this.registry.get(channel);

    if (!driver) {
      return {
        status: 'FAILED',
        errorMessage: `No driver registered for channel ${channel}`,
      };
    }

    return driver.send(payload);
  }

  getConfiguredChannels(): DharmaNotificationChannel[] {
    return [...this.registry.entries()]
      .filter(([, driver]) => driver.isConfigured())
      .map(([channel]) => channel);
  }
}

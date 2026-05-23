import { Injectable, Logger } from '@nestjs/common';

import {
  DharmaDriverPayload,
  DharmaDriverResult,
  DharmaNotificationChannel,
  DharmaNotificationDriver,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

@Injectable()
export class TelegramDriver implements DharmaNotificationDriver {
  readonly channel: DharmaNotificationChannel = 'TELEGRAM';

  private readonly logger = new Logger(TelegramDriver.name);

  isConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
  }

  async send(payload: DharmaDriverPayload): Promise<DharmaDriverResult> {
    if (!this.isConfigured()) {
      return {
        status: 'SKIPPED',
        errorMessage: 'TELEGRAM_BOT_TOKEN not set',
      };
    }

    const chatId = payload.recipient;

    if (!chatId) {
      return {
        status: 'SKIPPED',
        errorMessage: 'Missing Telegram chat_id (preference.endpoint)',
      };
    }

    const text = `*${this.escapeMd(payload.title)}*\n\n${this.escapeMd(
      payload.body,
    )}`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
          }),
        },
      );

      const data = (await response.json()) as {
        ok?: boolean;
        result?: { message_id?: number };
        description?: string;
      };

      if (!response.ok || !data.ok) {
        return {
          status: 'FAILED',
          errorMessage: `Telegram HTTP ${response.status}: ${
            data.description ?? 'unknown'
          }`,
        };
      }

      return {
        status: 'SENT',
        providerMessageId: data.result?.message_id
          ? String(data.result.message_id)
          : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`Telegram send failed: ${message}`);

      return { status: 'FAILED', errorMessage: message };
    }
  }

  // Telegram MarkdownV2 reserved chars
  private escapeMd(value: string): string {
    return value.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }
}

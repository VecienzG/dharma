import { Injectable, Logger } from '@nestjs/common';

import {
  DharmaDriverPayload,
  DharmaDriverResult,
  DharmaNotificationChannel,
  DharmaNotificationDriver,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class ResendEmailDriver implements DharmaNotificationDriver {
  readonly channel: DharmaNotificationChannel = 'EMAIL';

  private readonly logger = new Logger(ResendEmailDriver.name);

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  }

  async send(payload: DharmaDriverPayload): Promise<DharmaDriverResult> {
    if (!this.isConfigured()) {
      return {
        status: 'SKIPPED',
        errorMessage: 'RESEND_API_KEY or RESEND_FROM not set',
      };
    }

    const body = {
      from: process.env.RESEND_FROM,
      to: [payload.recipient],
      subject: payload.title,
      text: payload.body,
      html: this.toHtml(payload),
    };

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();

        return {
          status: 'FAILED',
          errorMessage: `Resend HTTP ${response.status}: ${text.slice(0, 240)}`,
        };
      }

      const data = (await response.json()) as { id?: string };

      return { status: 'SENT', providerMessageId: data.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`Resend send failed: ${message}`);

      return { status: 'FAILED', errorMessage: message };
    }
  }

  private toHtml(payload: DharmaDriverPayload): string {
    const escapedBody = this.escapeHtml(payload.body).replace(/\n/g, '<br>');
    const escapedTitle = this.escapeHtml(payload.title);

    return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a"><h1 style="font-size:20px;margin:0 0 16px">${escapedTitle}</h1><div style="font-size:15px;line-height:1.6">${escapedBody}</div></body></html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

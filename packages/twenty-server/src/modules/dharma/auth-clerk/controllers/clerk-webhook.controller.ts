import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Webhook } from 'svix';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

import { ClerkUserSyncService } from '../services/clerk-user-sync.service';

type ClerkWebhookEvent =
  | { type: 'user.created' | 'user.updated'; data: ClerkUserData }
  | { type: 'user.deleted'; data: { id: string; deleted: true } };

interface ClerkUserData {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url?: string;
}

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private readonly configService: TwentyConfigService,
    private readonly clerkUserSyncService: ClerkUserSyncService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const secret = this.configService.get('CLERK_WEBHOOK_SIGNING_SECRET');
    if (!secret) throw new BadRequestException('Webhook secret not configured');
    if (!req.rawBody) throw new BadRequestException('Raw body unavailable');

    const wh = new Webhook(secret);

    let evt: ClerkWebhookEvent;
    try {
      evt = wh.verify(req.rawBody.toString('utf8'), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await this.clerkUserSyncService.upsertFromWebhook(evt.data);
        return { ok: true };
      case 'user.deleted':
        await this.clerkUserSyncService.softDelete(evt.data.id);
        return { ok: true };
      default:
        return { ok: true, ignored: true };
    }
  }
}

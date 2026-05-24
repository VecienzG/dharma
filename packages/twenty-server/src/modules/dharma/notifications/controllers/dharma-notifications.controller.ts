import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { DharmaNotificationPreferencesService } from 'src/modules/dharma/notifications/services/dharma-notification-preferences.service';
import {
  type DharmaNotificationChannel,
  type DharmaNotificationKind,
  type DharmaNotificationPreferenceRecord,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

type UpsertPreferenceBody = {
  channel: DharmaNotificationChannel;
  enabled?: boolean;
  kinds?: DharmaNotificationKind[];
  mutedTags?: string[];
  minScore?: number;
  endpoint?: string | null;
  config?: Record<string, unknown> | null;
};

type SubscribePushBody = {
  // Standard web-push PushSubscription JSON shape.
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime?: number | null;
  };
  kinds?: DharmaNotificationKind[];
  minScore?: number;
};

@Controller('rest/dharma/notifications')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@UseFilters(RestApiExceptionFilter)
export class DharmaNotificationsController {
  constructor(
    private readonly preferences: DharmaNotificationPreferencesService,
  ) {}

  @Get('preferences')
  async listPreferences(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): Promise<DharmaNotificationPreferenceRecord[]> {
    return this.preferences.listForMember({
      workspaceId: workspace.id,
      workspaceMemberId,
    });
  }

  @Put('preferences')
  async upsertPreference(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Body() body: UpsertPreferenceBody,
  ): Promise<DharmaNotificationPreferenceRecord> {
    if (!body?.channel) {
      throw new BadRequestException('channel is required');
    }

    return this.preferences.upsert({
      workspaceId: workspace.id,
      workspaceMemberId,
      ...body,
    });
  }

  @Delete('preferences/:id')
  async deletePreference(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.preferences.delete({
      workspaceId: workspace.id,
      preferenceId: id,
      workspaceMemberId,
    });

    return { deleted };
  }

  @Post('push/subscribe')
  async subscribePush(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Body() body: SubscribePushBody,
  ): Promise<DharmaNotificationPreferenceRecord> {
    if (!body?.subscription?.endpoint) {
      throw new BadRequestException(
        'subscription.endpoint is required for web-push registration',
      );
    }

    return this.preferences.upsert({
      workspaceId: workspace.id,
      workspaceMemberId,
      channel: 'WEB_PUSH',
      enabled: true,
      kinds: body.kinds,
      minScore: body.minScore,
      // Endpoint is also kept on the row for visibility; the full PushSubscription
      // (keys, expirationTime) lives under config so the web-push driver can replay it.
      endpoint: body.subscription.endpoint,
      config: {
        subscription: body.subscription,
      },
    });
  }
}

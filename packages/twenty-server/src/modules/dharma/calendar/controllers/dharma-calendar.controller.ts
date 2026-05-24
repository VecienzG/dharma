import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { DharmaGoogleCalendarSyncService } from 'src/modules/dharma/calendar/services/dharma-google-calendar-sync.service';
import { DharmaGoogleOauthService } from 'src/modules/dharma/calendar/services/dharma-google-oauth.service';

// state = base64url(JSON({workspaceId, workspaceMemberId, nonce, callbackOrigin}))
const encodeState = (payload: Record<string, string>): string =>
  Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeState = (state: string): Record<string, string> => {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException('Invalid OAuth state');
  }
};

@Controller('rest/dharma/calendar')
@UseFilters(RestApiExceptionFilter)
export class DharmaCalendarController {
  constructor(
    private readonly oauthService: DharmaGoogleOauthService,
    private readonly syncService: DharmaGoogleCalendarSyncService,
  ) {}

  @Get('oauth/authorize')
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  authorize(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): { authorizeUrl: string } {
    const redirectUri = this.requireRedirectUri();
    const state = encodeState({
      workspaceId: workspace.id,
      workspaceMemberId,
      nonce: Math.random().toString(36).slice(2),
    });

    return {
      authorizeUrl: this.oauthService.buildAuthorizeUrl({ state, redirectUri }),
    };
  }

  // Public — Google redirects the browser here with ?code & ?state.
  @Get('oauth/callback')
  @UseGuards(PublicEndpointGuard)
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      throw new UnauthorizedException(`Google OAuth returned error: ${error}`);
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state in callback');
    }

    const decoded = decodeState(state);

    if (!decoded.workspaceId || !decoded.workspaceMemberId) {
      throw new BadRequestException('Invalid OAuth state payload');
    }

    const redirectUri = this.requireRedirectUri();

    await this.oauthService.exchangeCode({
      workspaceId: decoded.workspaceId,
      workspaceMemberId: decoded.workspaceMemberId,
      code,
      redirectUri,
    });

    // Bounce the browser back to the front-end so the SPA can render success state.
    const frontendOk =
      process.env.DHARMA_CALENDAR_FRONTEND_SUCCESS_URL ?? '/settings/calendar?status=connected';

    res.redirect(302, frontendOk);
  }

  @Post('sync/:connectionId/pull')
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  async pull(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('connectionId') connectionId: string,
  ) {
    return this.syncService.pullEvents({
      workspaceId: workspace.id,
      connectionId,
    });
  }

  @Post('sync/:connectionId/push')
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  async push(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('connectionId') connectionId: string,
    @Body()
    body: {
      summary: string;
      description?: string;
      startISO: string;
      endISO: string;
      attendeeEmails?: string[];
    },
  ) {
    return this.syncService.pushEvent({
      workspaceId: workspace.id,
      connectionId,
      event: body,
    });
  }

  private requireRedirectUri(): string {
    const value = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

    if (!value) {
      throw new BadRequestException(
        'GOOGLE_CALENDAR_REDIRECT_URI env var not configured',
      );
    }

    return value;
  }
}

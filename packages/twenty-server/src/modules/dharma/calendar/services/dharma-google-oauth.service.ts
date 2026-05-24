import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  type DharmaCalendarConnectionRecord,
  GOOGLE_CALENDAR_DEFAULT_SCOPE,
  GOOGLE_OAUTH_AUTHORIZE_URL,
  GOOGLE_OAUTH_TOKEN_URL,
  type GoogleTokenResponse,
} from 'src/modules/dharma/calendar/types/dharma-calendar.types';

const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000; // refresh 1min before expiry

@Injectable()
export class DharmaGoogleOauthService {
  private readonly logger = new Logger(DharmaGoogleOauthService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  // Step 1 — build the consent URL the browser must visit.
  buildAuthorizeUrl({
    state,
    redirectUri,
    scope = GOOGLE_CALENDAR_DEFAULT_SCOPE,
  }: {
    state: string;
    redirectUri: string;
    scope?: string;
  }): string {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CALENDAR_CLIENT_ID not configured',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${GOOGLE_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
  }

  // Step 2 — exchange the code we got at /callback for tokens, persist the row.
  async exchangeCode({
    workspaceId,
    workspaceMemberId,
    code,
    redirectUri,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    code: string;
    redirectUri: string;
  }): Promise<DharmaCalendarConnectionRecord> {
    const tokens = await this.requestTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens.refresh_token) {
      this.logger.warn(
        'Google did not return a refresh_token — user already granted consent, prompt=consent should fix this on next attempt',
      );
    }

    const googleEmail = await this.fetchGoogleEmail(tokens.access_token);

    return this.upsertConnection({
      workspaceId,
      workspaceMemberId,
      googleEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    });
  }

  // Returns a valid access token, refreshing it transparently if it's near expiry.
  async getValidAccessToken({
    workspaceId,
    connectionId,
  }: {
    workspaceId: string;
    connectionId: string;
  }): Promise<string> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaCalendarConnectionRecord>(
        workspaceId,
        'dharmaCalendarConnection',
        { shouldBypassPermissionChecks: true },
      );

    const connection = await repo.findOne({ where: { id: connectionId } });

    if (!connection?.accessToken || !connection.expiresAt) {
      throw new UnauthorizedException(
        `Calendar connection ${connectionId} has no access token`,
      );
    }

    const expiresAtMs = new Date(connection.expiresAt).getTime();

    if (expiresAtMs - Date.now() > TOKEN_EXPIRY_SAFETY_MARGIN_MS) {
      return connection.accessToken;
    }

    if (!connection.refreshToken) {
      throw new UnauthorizedException(
        `Calendar connection ${connectionId} expired and has no refresh token — user must re-authorize`,
      );
    }

    const tokens = await this.requestTokens({
      grant_type: 'refresh_token',
      refresh_token: connection.refreshToken,
    });

    await repo.update(
      { id: connectionId },
      {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        // Google can rotate refresh tokens — keep new one if provided.
        refreshToken: tokens.refresh_token ?? connection.refreshToken,
      },
    );

    return tokens.access_token;
  }

  private async requestTokens(
    params: Record<string, string>,
  ): Promise<GoogleTokenResponse> {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'GOOGLE_CALENDAR_CLIENT_ID / CLIENT_SECRET not configured',
      );
    }

    const body = new URLSearchParams({
      ...params,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text();

      this.logger.error(`Google token request failed: ${text.slice(0, 400)}`);

      throw new UnauthorizedException(
        `Google OAuth token exchange failed (${response.status})`,
      );
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  private async fetchGoogleEmail(accessToken: string): Promise<string | null> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return null;

    const json = (await response.json()) as { email?: string };

    return json.email ?? null;
  }

  private async upsertConnection({
    workspaceId,
    workspaceMemberId,
    googleEmail,
    accessToken,
    refreshToken,
    expiresAt,
    scope,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    googleEmail: string | null;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    scope: string;
  }): Promise<DharmaCalendarConnectionRecord> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaCalendarConnectionRecord>(
        workspaceId,
        'dharmaCalendarConnection',
        { shouldBypassPermissionChecks: true },
      );

    const existing = await repo.findOne({
      where: { workspaceMemberId, provider: 'GOOGLE' },
    });

    const payload = {
      workspaceMemberId,
      provider: 'GOOGLE' as const,
      googleEmail,
      accessToken,
      // Preserve the refresh token if Google did not return a new one on a re-consent.
      refreshToken: refreshToken ?? existing?.refreshToken ?? null,
      expiresAt,
      scope,
    };

    const saved = existing
      ? await repo.save({ ...existing, ...payload })
      : await repo.save(payload);

    const persisted = Array.isArray(saved) ? saved[0] : saved;

    return persisted as DharmaCalendarConnectionRecord;
  }
}

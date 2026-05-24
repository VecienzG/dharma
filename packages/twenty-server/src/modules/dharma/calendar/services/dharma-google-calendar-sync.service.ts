import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaGoogleOauthService } from 'src/modules/dharma/calendar/services/dharma-google-oauth.service';
import {
  type DharmaCalendarConnectionRecord,
  GOOGLE_CALENDAR_API_BASE,
  type GoogleCalendarEvent,
} from 'src/modules/dharma/calendar/types/dharma-calendar.types';

type SyncResult = {
  fetched: number;
  pushed: number;
  syncToken: string | null;
};

@Injectable()
export class DharmaGoogleCalendarSyncService {
  private readonly logger = new Logger(DharmaGoogleCalendarSyncService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly oauthService: DharmaGoogleOauthService,
  ) {}

  // Pulls events from Google into Dharma using the incremental syncToken when available.
  async pullEvents({
    workspaceId,
    connectionId,
  }: {
    workspaceId: string;
    connectionId: string;
  }): Promise<SyncResult> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaCalendarConnectionRecord>(
        workspaceId,
        'dharmaCalendarConnection',
        { shouldBypassPermissionChecks: true },
      );

    const connection = await repo.findOne({ where: { id: connectionId } });

    if (!connection) {
      throw new NotFoundException(`Calendar connection ${connectionId} not found`);
    }

    const accessToken = await this.oauthService.getValidAccessToken({
      workspaceId,
      connectionId,
    });

    const events: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;

    do {
      const params = new URLSearchParams({ singleEvents: 'true' });

      // Incremental sync when we have a syncToken from a previous round.
      if (connection.syncToken && !pageToken) {
        params.set('syncToken', connection.syncToken);
      } else if (!pageToken) {
        // First sync — pull events from the past 30 days forward.
        params.set(
          'timeMin',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        );
      }

      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(
        `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`,
        { headers: { authorization: `Bearer ${accessToken}` } },
      );

      if (response.status === 410) {
        // syncToken expired — clear it and let next call do a full sync
        this.logger.warn(
          `Google returned 410 for connection ${connectionId} — clearing syncToken`,
        );

        await repo.update({ id: connectionId }, { syncToken: null });

        return { fetched: 0, pushed: 0, syncToken: null };
      }

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `Google Calendar events.list failed (${response.status}): ${text.slice(0, 200)}`,
        );
      }

      const json = (await response.json()) as {
        items?: GoogleCalendarEvent[];
        nextPageToken?: string;
        nextSyncToken?: string;
      };

      events.push(...(json.items ?? []));
      pageToken = json.nextPageToken;
      nextSyncToken = json.nextSyncToken ?? null;
    } while (pageToken);

    await repo.update(
      { id: connectionId },
      {
        lastSyncedAt: new Date(),
        syncToken: nextSyncToken ?? connection.syncToken ?? null,
      },
    );

    this.logger.log(
      `Pulled ${events.length} calendar event(s) for connection=${connectionId}`,
    );

    // NOTE: persistence into Dharma activity/calendarEvent objects is intentionally
    // not done here yet — the activity model is being finalized in phase 7.
    // Events are surfaced via the return value so the orchestrator can act on them.
    return { fetched: events.length, pushed: 0, syncToken: nextSyncToken };
  }

  async pushEvent({
    workspaceId,
    connectionId,
    event,
  }: {
    workspaceId: string;
    connectionId: string;
    event: {
      summary: string;
      description?: string;
      startISO: string;
      endISO: string;
      attendeeEmails?: string[];
    };
  }): Promise<GoogleCalendarEvent> {
    const accessToken = await this.oauthService.getValidAccessToken({
      workspaceId,
      connectionId,
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startISO },
          end: { dateTime: event.endISO },
          attendees: event.attendeeEmails?.map((email) => ({ email })),
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Google Calendar events.insert failed (${response.status}): ${text.slice(0, 200)}`,
      );
    }

    return (await response.json()) as GoogleCalendarEvent;
  }
}

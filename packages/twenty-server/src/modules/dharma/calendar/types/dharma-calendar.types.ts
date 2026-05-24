export type DharmaCalendarConnectionRecord = {
  id: string;
  workspaceMemberId: string | null;
  provider: 'GOOGLE' | string | null;
  googleEmail: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | string | null;
  scope: string | null;
  lastSyncedAt: Date | string | null;
  syncToken: string | null;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  updated?: string;
  attendees?: Array<{ email: string; responseStatus?: string }>;
  hangoutLink?: string;
  htmlLink?: string;
};

export const GOOGLE_OAUTH_AUTHORIZE_URL =
  'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_CALENDAR_API_BASE =
  'https://www.googleapis.com/calendar/v3';
export const GOOGLE_CALENDAR_DEFAULT_SCOPE =
  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email';

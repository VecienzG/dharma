// Channels supported by Dharma notifications layer
export type DharmaNotificationChannel = 'EMAIL' | 'WEB_PUSH' | 'TELEGRAM';

export type DharmaNotificationKind =
  | 'AI_SUGGESTION'
  | 'TASK_DUE'
  | 'PAYMENT'
  | 'FOLLOWUP'
  | 'SYSTEM'
  | 'TEST';

export type DharmaNotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED';

export type DharmaNotificationSourceKind = 'AI' | 'SYSTEM' | 'MANUAL';

export type DharmaNotificationQuietHoursPolicy = 'NEVER' | 'DEFER' | 'DROP';

// Pre-persistence request crafted by the orchestrator/AI hook
export type DharmaNotificationRequest = {
  kind: DharmaNotificationKind;
  title: string;
  body: string;
  tags?: string[];
  payload?: Record<string, unknown>;
  // Optional explicit channel routing. If omitted, dispatcher resolves via preferences.
  channel?: DharmaNotificationChannel;
  // Optional recipient override (workspaceMember id). If omitted, dispatcher broadcasts to all members with matching prefs.
  workspaceMemberId?: string;
  sourceKind: DharmaNotificationSourceKind;
  sourceRecordId?: string;
  // 0..1 — used by preference minScore filter
  score?: number;
};

export type DharmaNotificationRecord = {
  id: string;
  channel: DharmaNotificationChannel | null;
  kind: DharmaNotificationKind | null;
  title: string | null;
  body: string | null;
  tags: string[] | null;
  payload: Record<string, unknown> | null;
  recipient: string | null;
  status: DharmaNotificationStatus | null;
  errorMessage: string | null;
  providerMessageId: string | null;
  scheduledAt: Date | string | null;
  sentAt: Date | string | null;
  sourceKind: DharmaNotificationSourceKind | null;
  sourceRecordId: string | null;
  workspaceMemberId: string | null;
  aiSuggestionId?: string | null;
};

export type DharmaNotificationPreferenceRecord = {
  id: string;
  channel: DharmaNotificationChannel | null;
  enabled: boolean | null;
  kinds: DharmaNotificationKind[] | null;
  mutedTags: string[] | null;
  minScore: number | null;
  endpoint: string | null;
  config: Record<string, unknown> | null;
  quietHoursPolicy: DharmaNotificationQuietHoursPolicy | null;
  workspaceMemberId: string | null;
};

// Result returned by a driver after attempting delivery
export type DharmaDriverResult =
  | { status: 'SENT'; providerMessageId?: string }
  | { status: 'FAILED'; errorMessage: string }
  | { status: 'SKIPPED'; errorMessage: string };

export type DharmaDriverPayload = {
  recipient: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  config?: Record<string, unknown>;
};

export interface DharmaNotificationDriver {
  readonly channel: DharmaNotificationChannel;
  isConfigured(): boolean;
  send(payload: DharmaDriverPayload): Promise<DharmaDriverResult>;
}

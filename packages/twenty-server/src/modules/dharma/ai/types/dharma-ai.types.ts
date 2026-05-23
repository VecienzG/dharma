// Suggestion kinds aligned with dharmaAiSuggestion.kind SELECT options
export type DharmaAiSuggestionKind =
  | 'TASK_PRIORITY'
  | 'FOLLOWUP'
  | 'PAYMENT'
  | 'REVENUE_ALERT'
  | 'INSIGHT';

export type DharmaAiSuggestionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DISMISSED';

export type DharmaAiSuggestionSource = 'RULES' | 'LLM' | 'HYBRID';

export type DharmaAiMemoryKind = 'FACT' | 'RULE' | 'PREFERENCE' | 'PATTERN';

export type DharmaAiMemorySource = 'USER_FEEDBACK' | 'MANUAL' | 'INFERRED';

// Output emitted by Layer 1 (Rules) before persistence
export type DharmaAiSignal = {
  kind: DharmaAiSuggestionKind;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  score: number;
  source: DharmaAiSuggestionSource;
};

// Snapshot returned by Layer 2 (Context)
export type DharmaAiContext = {
  workspaceId: string;
  generatedAt: string;
  finance: {
    period: string;
    grossIncome: number;
    blAvailable: number;
    taxCassetto: number;
    pendingPayouts: number;
  };
  projects: {
    activeCount: number;
    blockedCount: number;
    overdueCount: number;
  };
  contacts: {
    totalActive: number;
    staleFollowUpCount: number;
  };
  recentMemories: DharmaAiMemoryRecord[];
};

export type DharmaAiMemoryRecord = {
  id: string;
  kind: DharmaAiMemoryKind | null;
  content: string | null;
  tags: string[] | null;
  score: number | null;
  lastUsedAt: Date | string | null;
  source: DharmaAiMemorySource | null;
};

export type DharmaAiSuggestionRecord = {
  id: string;
  kind: DharmaAiSuggestionKind | null;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  status: DharmaAiSuggestionStatus | null;
  score: number | null;
  source: DharmaAiSuggestionSource | null;
  modelUsed: string | null;
  generatedAt: Date | string | null;
  resolvedAt: Date | string | null;
};

// Minimal record shapes for repositories used by AI layer
export type DharmaProjectRecord = {
  id: string;
  name: string | null;
  status:
    | 'DRAFT'
    | 'ACTIVE'
    | 'BLOCKED'
    | 'COMPLETED'
    | 'CANCELLED'
    | string
    | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
};

export type PersonRecord = {
  id: string;
  name: { firstName?: string; lastName?: string } | null;
  dharmaEntityType: 'CLIENT' | 'COLLABORATOR' | 'SUPPLIER' | string | null;
  dharmaPriority: 'LOW' | 'MEDIUM' | 'HIGH' | string | null;
  updatedAt: Date | string | null;
};

export const DEFAULT_AI_MODEL = 'claude-haiku-4-5';
export const REASONING_AI_MODEL = 'claude-sonnet-4-6';

// Stale follow-up threshold: contact not touched in N days
export const STALE_FOLLOWUP_DAYS = 21;

// Score thresholds — used by rules engine to assign suggestion score 0..1
export const SCORE_CRITICAL = 0.95;
export const SCORE_HIGH = 0.75;
export const SCORE_MEDIUM = 0.5;
export const SCORE_LOW = 0.25;

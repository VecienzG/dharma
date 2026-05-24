// Frontend type mirrors of dharmaAiSuggestion / dharmaAiMemory custom objects.
// Backend source of truth lives in:
//   packages/twenty-server/src/modules/dharma/ai/types/dharma-ai.types.ts

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

export type DharmaAiSuggestion = {
  id: string;
  kind: DharmaAiSuggestionKind;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  status: DharmaAiSuggestionStatus;
  score: number;
  source: DharmaAiSuggestionSource;
  modelUsed: string | null;
  generatedAt: string;
  resolvedAt: string | null;
};

export type DharmaAiMemoryKind = 'FACT' | 'RULE' | 'PREFERENCE' | 'PATTERN';

export type DharmaAiMemorySource = 'MANUAL' | 'AI_FEEDBACK' | 'RULE_INFERENCE';

export type DharmaAiMemory = {
  id: string;
  kind: DharmaAiMemoryKind;
  content: string;
  tags: string[];
  score: number;
  lastUsedAt: string | null;
  source: DharmaAiMemorySource;
  createdAt?: string;
  updatedAt?: string;
};

export const SCORE_HIGH_THRESHOLD = 0.75;
export const SCORE_MEDIUM_THRESHOLD = 0.5;

export type DharmaAiSuggestionAction = 'accept' | 'reject' | 'dismiss';

export type DharmaAiSuggestionFilters = {
  status: DharmaAiSuggestionStatus | 'ALL';
  kind: DharmaAiSuggestionKind | 'ALL';
  source: DharmaAiSuggestionSource | 'ALL';
  minScore: number;
};

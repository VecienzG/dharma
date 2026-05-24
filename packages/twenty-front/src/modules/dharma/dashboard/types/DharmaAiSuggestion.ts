// Mirrors the backend DharmaAiSuggestionRecord shape exposed by
// GET /rest/dharma/ai/suggestions. Status strings come from the SELECT
// field defined in dharma-ai-suggestion.field-seeds.ts.
export type DharmaAiSuggestionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DISMISSED';

export type DharmaAiSuggestion = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  status: DharmaAiSuggestionStatus;
  score: number | null;
  source: string | null;
  modelUsed: string | null;
  generatedAt: string | null;
  resolvedAt: string | null;
};

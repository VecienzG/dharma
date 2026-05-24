import { tokenPairState } from '@/auth/states/tokenPairState';
import {
  type DharmaAiSuggestion,
  type DharmaAiSuggestionAction,
  type DharmaAiSuggestionStatus,
} from '@/dharma/ai/types/DharmaAi';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useCallback, useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type UseDharmaSuggestionsParams = {
  status?: DharmaAiSuggestionStatus;
  limit?: number;
};

export type UseDharmaSuggestionsResult = {
  suggestions: DharmaAiSuggestion[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  actOnSuggestion: (
    suggestionId: string,
    action: DharmaAiSuggestionAction,
  ) => Promise<void>;
};

const buildListUrl = ({ status, limit }: UseDharmaSuggestionsParams) => {
  const params = new URLSearchParams();
  if (isDefined(status)) {
    params.set('status', status);
  }
  if (isDefined(limit)) {
    params.set('limit', String(limit));
  }
  const qs = params.toString();
  return `${REACT_APP_SERVER_BASE_URL}/rest/dharma/ai/suggestions${
    qs.length > 0 ? `?${qs}` : ''
  }`;
};

export const useDharmaSuggestions = (
  params: UseDharmaSuggestionsParams = {},
): UseDharmaSuggestionsResult => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const accessToken = tokenPair?.accessOrWorkspaceAgnosticToken?.token ?? null;

  const [suggestions, setSuggestions] = useState<DharmaAiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { status, limit } = params;

  const fetchSuggestions = useCallback(async () => {
    if (!isDefined(accessToken)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildListUrl({ status, limit }), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error(`Suggestion list failed: ${response.status}`);
      }
      const payload = (await response.json()) as {
        suggestions: DharmaAiSuggestion[];
      };
      setSuggestions(payload.suggestions ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Unknown error loading suggestions'),
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, status, limit]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const actOnSuggestion = useCallback(
    async (suggestionId: string, action: DharmaAiSuggestionAction) => {
      if (!isDefined(accessToken)) {
        throw new Error('Missing access token');
      }

      // Optimistic remove from current list — caller passes PENDING usually.
      const previous = suggestions;
      setSuggestions((current) =>
        current.filter((suggestion) => suggestion.id !== suggestionId),
      );

      try {
        const response = await fetch(
          `${REACT_APP_SERVER_BASE_URL}/rest/dharma/ai/suggestions/${suggestionId}/${action}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok) {
          throw new Error(`Suggestion ${action} failed: ${response.status}`);
        }
      } catch (caughtError) {
        setSuggestions(previous);
        throw caughtError instanceof Error
          ? caughtError
          : new Error(`Unknown error during ${action}`);
      }
    },
    [accessToken, suggestions],
  );

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions,
    actOnSuggestion,
  };
};

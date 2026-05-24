import { useCallback, useEffect, useState } from 'react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  type DharmaAiSuggestion,
  type DharmaAiSuggestionStatus,
} from '@/dharma/dashboard/types/DharmaAiSuggestion';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type SuggestionAction = 'accept' | 'reject' | 'dismiss';

type UseDharmaSuggestionsParams = {
  status?: DharmaAiSuggestionStatus;
  limit?: number;
  skip?: boolean;
};

type UseDharmaSuggestionsResult = {
  suggestions: DharmaAiSuggestion[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  resolveSuggestion: (
    suggestionId: string,
    action: SuggestionAction,
  ) => Promise<void>;
};

// Backend mounts REST suggestions API at /rest/dharma/ai/suggestions and
// requires the workspace JWT (accessOrWorkspaceAgnosticToken) as Bearer.
const SUGGESTIONS_PATH = '/rest/dharma/ai/suggestions';

export const useDharmaSuggestions = ({
  status = 'PENDING',
  limit,
  skip = false,
}: UseDharmaSuggestionsParams = {}): UseDharmaSuggestionsResult => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const accessToken = tokenPair?.accessOrWorkspaceAgnosticToken.token ?? null;

  const [suggestions, setSuggestions] = useState<DharmaAiSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (skip || accessToken === null) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${REACT_APP_SERVER_BASE_URL}${SUGGESTIONS_PATH}`);
      url.searchParams.set('status', status);
      if (typeof limit === 'number') {
        url.searchParams.set('limit', String(limit));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Caricamento suggerimenti fallito (${response.status})`,
        );
      }

      const data = (await response.json()) as DharmaAiSuggestion[];
      // Sort defensively client-side so the highest-score items always lead.
      const sorted = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setSuggestions(sorted);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError
          : new Error('Errore sconosciuto nel caricamento suggerimenti'),
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, limit, skip, status]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const resolveSuggestion = useCallback(
    async (suggestionId: string, action: SuggestionAction) => {
      if (accessToken === null) {
        throw new Error('Sessione non attiva');
      }

      const response = await fetch(
        `${REACT_APP_SERVER_BASE_URL}${SUGGESTIONS_PATH}/${suggestionId}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        throw new Error(`Azione "${action}" fallita (${response.status})`);
      }

      // Optimistically drop the resolved suggestion; next refetch reconciles.
      setSuggestions((prev) =>
        prev.filter((suggestion) => suggestion.id !== suggestionId),
      );
    },
    [accessToken],
  );

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions,
    resolveSuggestion,
  };
};

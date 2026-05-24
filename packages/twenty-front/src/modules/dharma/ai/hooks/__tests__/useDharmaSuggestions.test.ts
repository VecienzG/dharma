import { act, renderHook, waitFor } from '@testing-library/react';

jest.mock('~/config', () => ({
  REACT_APP_SERVER_BASE_URL: 'https://api.test',
}));

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(() => ({
    accessOrWorkspaceAgnosticToken: {
      token: 'test-token',
      expiresAt: 'never',
    },
    refreshToken: { token: 'refresh', expiresAt: 'never' },
  })),
}));

// eslint-disable-next-line import/order, import/first
import { useDharmaSuggestions } from '@/dharma/ai/hooks/useDharmaSuggestions';

const mockJsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe('useDharmaSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch suggestions on mount and expose them with bearer token', async () => {
    const suggestions = [
      {
        id: 's-1',
        kind: 'TASK_PRIORITY',
        title: 'Prioritize quote review',
        body: null,
        payload: null,
        status: 'PENDING',
        score: 0.91,
        source: 'RULES',
        modelUsed: null,
        generatedAt: '2026-05-24T00:00:00.000Z',
        resolvedAt: null,
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve(mockJsonResponse({ suggestions })),
    ) as jest.Mock;

    const { result } = renderHook(() =>
      useDharmaSuggestions({ status: 'PENDING', limit: 25 }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.suggestions).toEqual(suggestions);
    expect(result.current.error).toBeNull();

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/rest/dharma/ai/suggestions?status=PENDING&limit=25',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('should remove a suggestion optimistically on accept and call the accept endpoint', async () => {
    const suggestions = [
      {
        id: 's-1',
        kind: 'FOLLOWUP',
        title: 'Follow up',
        body: null,
        payload: null,
        status: 'PENDING',
        score: 0.7,
        source: 'LLM',
        modelUsed: 'claude-haiku-4-5',
        generatedAt: '2026-05-24T00:00:00.000Z',
        resolvedAt: null,
      },
    ];

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockJsonResponse({ suggestions }))
      .mockResolvedValueOnce(
        mockJsonResponse({ status: 'ACCEPTED' }) as unknown as Response,
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useDharmaSuggestions());

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.actOnSuggestion('s-1', 'accept');
    });

    expect(result.current.suggestions).toHaveLength(0);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.test/rest/dharma/ai/suggestions/s-1/accept',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

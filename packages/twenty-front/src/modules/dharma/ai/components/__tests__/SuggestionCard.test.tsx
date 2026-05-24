import { SuggestionCard } from '@/dharma/ai/components/SuggestionCard';
import { type DharmaAiSuggestion } from '@/dharma/ai/types/DharmaAi';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'twenty-ui/theme-constants';

const buildSuggestion = (
  overrides: Partial<DharmaAiSuggestion> = {},
): DharmaAiSuggestion => ({
  id: 'sugg-1',
  kind: 'FOLLOWUP',
  title: 'Contatta cliente Acme',
  body: 'Nessun touchpoint da 21 giorni.',
  payload: { personId: 'p-1' },
  status: 'PENDING',
  score: 0.82,
  source: 'HYBRID',
  modelUsed: 'claude-haiku-4-5',
  generatedAt: '2026-05-24T08:00:00.000Z',
  resolvedAt: null,
  ...overrides,
});

const renderCard = (
  overrides: {
    onAction?: jest.Mock;
    suggestion?: DharmaAiSuggestion;
  } = {},
) => {
  const onAction = overrides.onAction ?? jest.fn();
  render(
    <ThemeProvider colorScheme="light">
      <SuggestionCard
        suggestion={overrides.suggestion ?? buildSuggestion()}
        onAction={onAction}
      />
    </ThemeProvider>,
  );
  return { onAction };
};

describe('SuggestionCard', () => {
  it('should render title, kind label, source label and all three actions', () => {
    renderCard();

    expect(screen.getByText('Contatta cliente Acme')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
    expect(screen.getByText('Origine: Ibrido')).toBeInTheDocument();
    expect(
      screen.getByTestId('suggestion-card-accept-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('suggestion-card-reject-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('suggestion-card-dismiss-button'),
    ).toBeInTheDocument();
  });

  it('should invoke onAction with accept when the accept button is clicked', async () => {
    const { onAction } = renderCard();

    await userEvent.click(screen.getByTestId('suggestion-card-accept-button'));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith('sugg-1', 'accept');
  });

  it('should invoke onAction with reject and dismiss for the other buttons', async () => {
    const { onAction } = renderCard();

    await userEvent.click(screen.getByTestId('suggestion-card-reject-button'));
    await userEvent.click(screen.getByTestId('suggestion-card-dismiss-button'));

    expect(onAction).toHaveBeenNthCalledWith(1, 'sugg-1', 'reject');
    expect(onAction).toHaveBeenNthCalledWith(2, 'sugg-1', 'dismiss');
  });
});

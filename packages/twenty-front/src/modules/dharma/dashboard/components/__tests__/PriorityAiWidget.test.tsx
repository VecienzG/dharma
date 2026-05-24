import { PriorityAiWidget } from '@/dharma/dashboard/components/widgets/PriorityAiWidget';
import { useDharmaSuggestions } from '@/dharma/dashboard/hooks/useDharmaSuggestions';
import { type DharmaAiSuggestion } from '@/dharma/dashboard/types/DharmaAiSuggestion';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/dharma/dashboard/hooks/useDharmaSuggestions');

const mockUseDharmaSuggestions = useDharmaSuggestions as jest.MockedFunction<
  typeof useDharmaSuggestions
>;

const buildSuggestion = (
  overrides: Partial<DharmaAiSuggestion> = {},
): DharmaAiSuggestion => ({
  id: 'sugg-1',
  kind: 'CONTACT_FOLLOWUP',
  title: 'Ricontatta Marco Rossi',
  body: 'Ultimo contatto 35 giorni fa.',
  status: 'PENDING',
  score: 87,
  source: 'rules',
  modelUsed: null,
  generatedAt: null,
  resolvedAt: null,
  ...overrides,
});

describe('PriorityAiWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render top suggestions with title and score', () => {
    mockUseDharmaSuggestions.mockReturnValue({
      suggestions: [buildSuggestion()],
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(undefined),
      resolveSuggestion: jest.fn().mockResolvedValue(undefined),
    });

    render(<PriorityAiWidget />);

    expect(screen.getByText('Ricontatta Marco Rossi')).toBeInTheDocument();
    expect(
      screen.getByText('Ultimo contatto 35 giorni fa.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Score 87')).toBeInTheDocument();
  });

  it('should call resolveSuggestion with "accept" when the accept button is clicked', async () => {
    const resolveSuggestion = jest.fn().mockResolvedValue(undefined);
    mockUseDharmaSuggestions.mockReturnValue({
      suggestions: [buildSuggestion()],
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(undefined),
      resolveSuggestion,
    });

    const user = userEvent.setup();
    render(<PriorityAiWidget />);

    await act(async () => {
      await user.click(
        screen.getByRole('button', {
          name: /Accetta suggerimento Ricontatta Marco Rossi/i,
        }),
      );
    });

    expect(resolveSuggestion).toHaveBeenCalledWith('sugg-1', 'accept');
  });

  it('should show an empty state when there are no suggestions', () => {
    mockUseDharmaSuggestions.mockReturnValue({
      suggestions: [],
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(undefined),
      resolveSuggestion: jest.fn().mockResolvedValue(undefined),
    });

    render(<PriorityAiWidget />);

    expect(
      screen.getByText(/Nessun suggerimento pendente/i),
    ).toBeInTheDocument();
  });
});

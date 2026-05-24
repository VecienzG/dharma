import { useState } from 'react';

import { useDharmaSuggestions } from '@/dharma/dashboard/hooks/useDharmaSuggestions';
import { type DharmaAiSuggestion } from '@/dharma/dashboard/types/DharmaAiSuggestion';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { IconCheck, IconSparkles, IconX } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const TOP_SUGGESTION_LIMIT = 5;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  grid-column: span 2;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.header`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledItem = styled.li`
  align-items: flex-start;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledItemBody = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledItemTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledItemDescription = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledScoreBadge = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledActionButton = styled.button<{ variant: 'accept' | 'dismiss' }>`
  align-items: center;
  background: ${({ variant }) =>
    variant === 'accept'
      ? themeCssVariables.color.green
      : themeCssVariables.background.transparent.light};
  border: 1px solid
    ${({ variant }) =>
      variant === 'accept'
        ? themeCssVariables.color.green
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ variant }) =>
    variant === 'accept'
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  height: ${themeCssVariables.spacing[6]};
  justify-content: center;
  padding: 0 ${themeCssVariables.spacing[2]};
  transition: opacity 150ms ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]} 0;
  text-align: center;
`;

const StyledErrorState = styled.div`
  color: ${themeCssVariables.color.red};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const formatScore = (score: number | null): string | null => {
  if (!isDefined(score)) {
    return null;
  }
  return `${Math.round(score)}`;
};

export const PriorityAiWidget = () => {
  const { suggestions, loading, error, resolveSuggestion, refetch } =
    useDharmaSuggestions({ status: 'PENDING' });

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleSuggestions: DharmaAiSuggestion[] = suggestions.slice(
    0,
    TOP_SUGGESTION_LIMIT,
  );

  const handleAction = async (
    suggestionId: string,
    action: 'accept' | 'dismiss',
  ) => {
    setResolvingId(suggestionId);
    setActionError(null);
    try {
      await resolveSuggestion(suggestionId, action);
    } catch (resolveError) {
      setActionError(
        resolveError instanceof Error
          ? resolveError.message
          : 'Errore imprevisto',
      );
      // Reconcile state from server when something goes wrong.
      await refetch();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <StyledCard aria-label="Priorità AI">
      <StyledHeader>
        <IconSparkles size={20} />
        <div>
          <StyledTitle>Priorità AI</StyledTitle>
          <StyledSubtitle>
            Top {TOP_SUGGESTION_LIMIT} azioni suggerite per oggi
          </StyledSubtitle>
        </div>
      </StyledHeader>

      {actionError !== null && (
        <StyledErrorState role="alert">{actionError}</StyledErrorState>
      )}

      {error !== null && (
        <StyledErrorState role="alert">{error.message}</StyledErrorState>
      )}

      {loading && visibleSuggestions.length === 0 ? (
        <StyledEmptyState>Caricamento suggerimenti…</StyledEmptyState>
      ) : visibleSuggestions.length === 0 ? (
        <StyledEmptyState>
          Nessun suggerimento pendente. Goditi la calma.
        </StyledEmptyState>
      ) : (
        <StyledList>
          {visibleSuggestions.map((suggestion) => {
            const formattedScore = formatScore(suggestion.score);
            const isBusy = resolvingId === suggestion.id;

            return (
              <StyledItem key={suggestion.id}>
                <StyledItemBody>
                  <StyledItemTitle>{suggestion.title}</StyledItemTitle>
                  {isDefined(suggestion.body) && suggestion.body !== '' && (
                    <StyledItemDescription>
                      {suggestion.body}
                    </StyledItemDescription>
                  )}
                  {formattedScore !== null && (
                    <StyledScoreBadge>Score {formattedScore}</StyledScoreBadge>
                  )}
                </StyledItemBody>
                <StyledActions>
                  <StyledActionButton
                    variant="accept"
                    aria-label={`Accetta suggerimento ${suggestion.title}`}
                    disabled={isBusy}
                    onClick={() => void handleAction(suggestion.id, 'accept')}
                  >
                    <IconCheck size={14} />
                    Accetta
                  </StyledActionButton>
                  <StyledActionButton
                    variant="dismiss"
                    aria-label={`Ignora suggerimento ${suggestion.title}`}
                    disabled={isBusy}
                    onClick={() => void handleAction(suggestion.id, 'dismiss')}
                  >
                    <IconX size={14} />
                    Ignora
                  </StyledActionButton>
                </StyledActions>
              </StyledItem>
            );
          })}
        </StyledList>
      )}
    </StyledCard>
  );
};

import { SuggestionScoreBar } from '@/dharma/ai/components/SuggestionScoreBar';
import { type DharmaAiSuggestion } from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { IconX } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SuggestionDetailDrawerProps = {
  suggestion: DharmaAiSuggestion | null;
  onClose: () => void;
};

const StyledOverlay = styled.div`
  background: ${themeCssVariables.background.overlayPrimary};
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 100;
`;

const StyledDrawer = styled.aside`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 101;
`;

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  text-transform: uppercase;
`;

const StyledValue = styled.p`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
  white-space: pre-wrap;
`;

const StyledPayload = styled.pre`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xs};
  margin: 0;
  max-height: 280px;
  overflow: auto;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
  word-break: break-word;
`;

const formatDate = (iso: string | null): string => {
  if (iso === null) return '-';
  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const SuggestionDetailDrawer = ({
  suggestion,
  onClose,
}: SuggestionDetailDrawerProps) => {
  if (suggestion === null) {
    return null;
  }

  return (
    <>
      <StyledOverlay onClick={onClose} />
      <StyledDrawer role="dialog" aria-label="Dettaglio suggerimento">
        <StyledHeader>
          <StyledTitle>{suggestion.title}</StyledTitle>
          <Button
            variant="tertiary"
            Icon={IconX}
            onClick={onClose}
            ariaLabel="Chiudi"
          />
        </StyledHeader>
        <StyledBody>
          <StyledSection>
            <StyledLabel>Punteggio</StyledLabel>
            <SuggestionScoreBar score={suggestion.score} />
          </StyledSection>

          {suggestion.body !== null && suggestion.body !== '' ? (
            <StyledSection>
              <StyledLabel>Descrizione</StyledLabel>
              <StyledValue>{suggestion.body}</StyledValue>
            </StyledSection>
          ) : null}

          <StyledSection>
            <StyledLabel>Origine</StyledLabel>
            <StyledValue>
              {suggestion.source}
              {suggestion.modelUsed !== null
                ? ` — ${suggestion.modelUsed}`
                : ''}
            </StyledValue>
          </StyledSection>

          <StyledSection>
            <StyledLabel>Stato</StyledLabel>
            <StyledValue>{suggestion.status}</StyledValue>
          </StyledSection>

          <StyledSection>
            <StyledLabel>Generato</StyledLabel>
            <StyledValue>{formatDate(suggestion.generatedAt)}</StyledValue>
          </StyledSection>

          {suggestion.resolvedAt !== null ? (
            <StyledSection>
              <StyledLabel>Risolto</StyledLabel>
              <StyledValue>{formatDate(suggestion.resolvedAt)}</StyledValue>
            </StyledSection>
          ) : null}

          {suggestion.payload !== null ? (
            <StyledSection>
              <StyledLabel>Payload</StyledLabel>
              <StyledPayload>
                {JSON.stringify(suggestion.payload, null, 2)}
              </StyledPayload>
            </StyledSection>
          ) : null}
        </StyledBody>
      </StyledDrawer>
    </>
  );
};

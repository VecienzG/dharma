import { SuggestionScoreBar } from '@/dharma/ai/components/SuggestionScoreBar';
import {
  type DharmaAiSuggestion,
  type DharmaAiSuggestionAction,
  type DharmaAiSuggestionKind,
} from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { IconCheck, IconEyeOff, IconX } from 'twenty-ui/display';
import { Tag, type TagColor } from 'twenty-ui/components';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SuggestionCardProps = {
  suggestion: DharmaAiSuggestion;
  onAction: (suggestionId: string, action: DharmaAiSuggestionAction) => void;
  onSelect?: (suggestion: DharmaAiSuggestion) => void;
};

const StyledCard = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledMetaRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.button`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 0;
  text-align: left;

  &:hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledBody = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
  white-space: pre-wrap;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const KIND_TAG_COLOR: Record<DharmaAiSuggestionKind, TagColor> = {
  TASK_PRIORITY: 'blue',
  FOLLOWUP: 'purple',
  PAYMENT: 'green',
  REVENUE_ALERT: 'orange',
  INSIGHT: 'sky',
};

const KIND_LABEL: Record<DharmaAiSuggestionKind, string> = {
  TASK_PRIORITY: 'Priorità task',
  FOLLOWUP: 'Follow-up',
  PAYMENT: 'Pagamento',
  REVENUE_ALERT: 'Avviso ricavi',
  INSIGHT: 'Insight',
};

const SOURCE_LABEL: Record<DharmaAiSuggestion['source'], string> = {
  RULES: 'Regole',
  LLM: 'LLM',
  HYBRID: 'Ibrido',
};

export const SuggestionCard = ({
  suggestion,
  onAction,
  onSelect,
}: SuggestionCardProps) => {
  const handleTitleClick = () => onSelect?.(suggestion);

  return (
    <StyledCard data-testid="suggestion-card">
      <StyledHeader>
        <StyledMetaRow>
          <Tag
            color={KIND_TAG_COLOR[suggestion.kind]}
            text={KIND_LABEL[suggestion.kind]}
          />
          <Tag
            color="transparent"
            variant="border"
            text={`Origine: ${SOURCE_LABEL[suggestion.source]}`}
          />
        </StyledMetaRow>
      </StyledHeader>

      <StyledTitle type="button" onClick={handleTitleClick}>
        {suggestion.title}
      </StyledTitle>

      {suggestion.body !== null && suggestion.body !== '' ? (
        <StyledBody>{suggestion.body}</StyledBody>
      ) : null}

      <SuggestionScoreBar score={suggestion.score} />

      <StyledActions>
        <Button
          variant="secondary"
          accent="default"
          Icon={IconEyeOff}
          title="Ignora"
          onClick={() => onAction(suggestion.id, 'dismiss')}
          dataTestId="suggestion-card-dismiss-button"
        />
        <Button
          variant="secondary"
          accent="danger"
          Icon={IconX}
          title="Rifiuta"
          onClick={() => onAction(suggestion.id, 'reject')}
          dataTestId="suggestion-card-reject-button"
        />
        <Button
          variant="primary"
          accent="blue"
          Icon={IconCheck}
          title="Accetta"
          onClick={() => onAction(suggestion.id, 'accept')}
          dataTestId="suggestion-card-accept-button"
        />
      </StyledActions>
    </StyledCard>
  );
};

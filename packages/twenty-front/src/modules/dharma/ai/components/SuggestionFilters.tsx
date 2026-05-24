import {
  type DharmaAiSuggestionFilters,
  type DharmaAiSuggestionKind,
  type DharmaAiSuggestionSource,
  type DharmaAiSuggestionStatus,
} from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SuggestionFiltersProps = {
  filters: DharmaAiSuggestionFilters;
  onChange: (next: DharmaAiSuggestionFilters) => void;
};

const STATUS_OPTIONS: Array<{
  value: DharmaAiSuggestionStatus | 'ALL';
  label: string;
}> = [
  { value: 'PENDING', label: 'Da rivedere' },
  { value: 'ACCEPTED', label: 'Accettate' },
  { value: 'REJECTED', label: 'Rifiutate' },
  { value: 'DISMISSED', label: 'Ignorate' },
  { value: 'ALL', label: 'Tutte' },
];

const KIND_OPTIONS: Array<{
  value: DharmaAiSuggestionKind | 'ALL';
  label: string;
}> = [
  { value: 'ALL', label: 'Tutti i tipi' },
  { value: 'TASK_PRIORITY', label: 'Priorità task' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'PAYMENT', label: 'Pagamento' },
  { value: 'REVENUE_ALERT', label: 'Avviso ricavi' },
  { value: 'INSIGHT', label: 'Insight' },
];

const SOURCE_OPTIONS: Array<{
  value: DharmaAiSuggestionSource | 'ALL';
  label: string;
}> = [
  { value: 'ALL', label: 'Ogni origine' },
  { value: 'RULES', label: 'Regole' },
  { value: 'LLM', label: 'LLM' },
  { value: 'HYBRID', label: 'Ibrido' },
];

const StyledRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledChip = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active
      ? themeCssVariables.background.invertedPrimary
      : themeCssVariables.background.tertiary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.strong
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${({ active }) =>
      active
        ? themeCssVariables.background.invertedSecondary
        : themeCssVariables.background.transparent.medium};
  }
`;

const StyledSliderRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSliderLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  min-width: 110px;
`;

const StyledSlider = styled.input`
  flex: 1 1 auto;
`;

const StyledScoreValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  min-width: ${themeCssVariables.spacing[8]};
  text-align: right;
`;

export const SuggestionFilters = ({
  filters,
  onChange,
}: SuggestionFiltersProps) => {
  return (
    <StyledRow>
      <StyledChipRow data-testid="suggestion-filters-status">
        {STATUS_OPTIONS.map((option) => (
          <StyledChip
            key={`status-${option.value}`}
            active={filters.status === option.value}
            type="button"
            onClick={() => onChange({ ...filters, status: option.value })}
          >
            {option.label}
          </StyledChip>
        ))}
      </StyledChipRow>

      <StyledChipRow data-testid="suggestion-filters-kind">
        {KIND_OPTIONS.map((option) => (
          <StyledChip
            key={`kind-${option.value}`}
            active={filters.kind === option.value}
            type="button"
            onClick={() => onChange({ ...filters, kind: option.value })}
          >
            {option.label}
          </StyledChip>
        ))}
      </StyledChipRow>

      <StyledChipRow data-testid="suggestion-filters-source">
        {SOURCE_OPTIONS.map((option) => (
          <StyledChip
            key={`source-${option.value}`}
            active={filters.source === option.value}
            type="button"
            onClick={() => onChange({ ...filters, source: option.value })}
          >
            {option.label}
          </StyledChip>
        ))}
      </StyledChipRow>

      <StyledSliderRow>
        <StyledSliderLabel htmlFor="suggestion-min-score">
          Punteggio minimo
        </StyledSliderLabel>
        <StyledSlider
          id="suggestion-min-score"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={filters.minScore}
          onChange={(event) =>
            onChange({
              ...filters,
              minScore: Number(event.target.value),
            })
          }
        />
        <StyledScoreValue>{filters.minScore.toFixed(2)}</StyledScoreValue>
      </StyledSliderRow>
    </StyledRow>
  );
};

import {
  SCORE_HIGH_THRESHOLD,
  SCORE_MEDIUM_THRESHOLD,
} from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SuggestionScoreBarProps = {
  score: number;
};

const StyledWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledTrack = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.pill};
  flex: 1 1 auto;
  height: ${themeCssVariables.spacing[1]};
  overflow: hidden;
`;

const StyledFill = styled.div<{ tone: 'high' | 'medium' | 'low' }>`
  background: ${({ tone }) =>
    tone === 'high'
      ? themeCssVariables.color.green
      : tone === 'medium'
        ? themeCssVariables.color.amber
        : themeCssVariables.color.gray};
  height: 100%;
  transition: width var(--t-animation-duration-fast, 150ms) ease-out;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  min-width: ${themeCssVariables.spacing[6]};
  text-align: right;
`;

const resolveTone = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= SCORE_HIGH_THRESHOLD) return 'high';
  if (score >= SCORE_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
};

export const SuggestionScoreBar = ({ score }: SuggestionScoreBarProps) => {
  const clamped = Math.max(0, Math.min(1, score));
  const tone = resolveTone(clamped);
  return (
    <StyledWrapper>
      <StyledTrack aria-label={`Punteggio ${(clamped * 100).toFixed(0)}%`}>
        <StyledFill tone={tone} style={{ width: `${clamped * 100}%` }} />
      </StyledTrack>
      <StyledLabel>{clamped.toFixed(2)}</StyledLabel>
    </StyledWrapper>
  );
};

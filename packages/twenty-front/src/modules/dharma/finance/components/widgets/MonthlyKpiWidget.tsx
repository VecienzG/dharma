import { styled } from '@linaria/react';
import { IconTrendingDown, IconTrendingUp } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type DharmaMonthlyKpi } from '@/dharma/finance/types/DharmaFinanceTypes';
import {
  formatCurrency,
  formatPercent,
} from '@/dharma/finance/utils/formatCurrency';

type MonthlyKpiWidgetProps = {
  current: DharmaMonthlyKpi;
  previous: DharmaMonthlyKpi;
};

type KpiTone = 'positive' | 'negative' | 'neutral';

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledCell = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StyledValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDelta = styled.span<{ tone: KpiTone }>`
  align-items: center;
  color: ${({ tone }) =>
    tone === 'positive'
      ? themeCssVariables.tag.text.green
      : tone === 'negative'
        ? themeCssVariables.tag.text.red
        : themeCssVariables.font.color.tertiary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const computeDelta = (
  current: number,
  previous: number,
): {
  ratio: number;
  tone: KpiTone;
} => {
  if (previous === 0) {
    return {
      ratio: current === 0 ? 0 : 1,
      tone: current === 0 ? 'neutral' : 'positive',
    };
  }
  const ratio = (current - previous) / Math.abs(previous);
  return {
    ratio,
    tone: ratio > 0 ? 'positive' : ratio < 0 ? 'negative' : 'neutral',
  };
};

const renderDelta = (
  current: number,
  previous: number,
  inverted = false,
): JSX.Element => {
  const { ratio, tone } = computeDelta(current, previous);
  // For expenses we invert the tone (less is good).
  const adjustedTone: KpiTone = inverted
    ? tone === 'positive'
      ? 'negative'
      : tone === 'negative'
        ? 'positive'
        : 'neutral'
    : tone;

  const Icon = ratio >= 0 ? IconTrendingUp : IconTrendingDown;

  return (
    <StyledDelta tone={adjustedTone}>
      <Icon size={12} />
      {formatPercent(Math.abs(ratio))} vs mese precedente
    </StyledDelta>
  );
};

export const MonthlyKpiWidget = ({
  current,
  previous,
}: MonthlyKpiWidgetProps) => {
  return (
    <StyledGrid>
      <StyledCell>
        <StyledLabel>Entrate</StyledLabel>
        <StyledValue>{formatCurrency(current.grossIncome)}</StyledValue>
        {renderDelta(current.grossIncome, previous.grossIncome)}
      </StyledCell>

      <StyledCell>
        <StyledLabel>Uscite</StyledLabel>
        <StyledValue>{formatCurrency(current.totalExpenses)}</StyledValue>
        {renderDelta(current.totalExpenses, previous.totalExpenses, true)}
      </StyledCell>

      <StyledCell>
        <StyledLabel>Netto</StyledLabel>
        <StyledValue>{formatCurrency(current.net)}</StyledValue>
        {renderDelta(current.net, previous.net)}
      </StyledCell>

      <StyledCell>
        <StyledLabel>Mix Fatturato / Cassa</StyledLabel>
        <StyledValue>
          {formatPercent(current.invoicedShare)} ·{' '}
          {formatPercent(current.cashShare)}
        </StyledValue>
        <StyledDelta tone="neutral">
          {current.entryCount}{' '}
          {current.entryCount === 1 ? 'entrata' : 'entrate'} questo mese
        </StyledDelta>
      </StyledCell>
    </StyledGrid>
  );
};

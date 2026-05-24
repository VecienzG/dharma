import { useMemo } from 'react';

import {
  DHARMA_DASHBOARD_LIMITS,
  incomeWidgetGqlFields,
} from '@/dharma/dashboard/graphql/queries/findDharmaDashboardData';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { IconArrowDown, IconArrowUp, IconCoins } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type IncomeRecord = ObjectRecord & {
  id: string;
  description: string | null;
  grossAmount: {
    amountMicros: number | string | null;
    currencyCode: string | null;
  } | null;
  receivedAt: string | null;
};

const MICRO_PER_UNIT = 1_000_000;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.header`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledMainAmount = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledComparison = styled.div<{ isPositive: boolean }>`
  align-items: center;
  color: ${({ isPositive }) =>
    isPositive ? themeCssVariables.color.green : themeCssVariables.color.red};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledMutedLine = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const startOfWeekMonday = (input: Date): Date => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  // getDay: 0 = Sunday. Convert so Monday becomes 0.
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
};

const toMicros = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatCurrency = (
  totalMicros: number,
  currencyCode: string | null,
): string => {
  const amountUnits = totalMicros / MICRO_PER_UNIT;
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currencyCode ?? 'EUR',
      maximumFractionDigits: 0,
    }).format(amountUnits);
  } catch {
    return `${amountUnits.toFixed(0)} ${currencyCode ?? ''}`.trim();
  }
};

export const RevenueWeekWidget = () => {
  const { rangeStartIso, lastWeekStartIso } = useMemo(() => {
    const now = new Date();
    const currentStart = startOfWeekMonday(now);
    const lastStart = new Date(currentStart);
    lastStart.setDate(lastStart.getDate() - 7);
    return {
      rangeStartIso: lastStart.toISOString().slice(0, 10),
      lastWeekStartIso: currentStart.toISOString().slice(0, 10),
    };
  }, []);

  // Single query covers both windows; we partition client-side.
  const { records, loading, error } = useFindManyRecords<IncomeRecord>({
    objectNameSingular: 'dharmaIncomeEntry',
    filter: {
      and: [{ receivedAt: { gte: rangeStartIso } }],
    },
    orderBy: [{ receivedAt: 'AscNullsFirst' }],
    limit: DHARMA_DASHBOARD_LIMITS.incomeWeek,
    recordGqlFields: incomeWidgetGqlFields,
  });

  const { currentWeekMicros, lastWeekMicros, currencyCode } = useMemo(() => {
    let currentMicros = 0;
    let previousMicros = 0;
    let detectedCurrency: string | null = null;

    for (const income of records) {
      if (income.receivedAt === null) {
        continue;
      }
      const micros = toMicros(income.grossAmount?.amountMicros);
      if (detectedCurrency === null) {
        detectedCurrency = income.grossAmount?.currencyCode ?? null;
      }
      if (income.receivedAt >= lastWeekStartIso) {
        currentMicros += micros;
      } else {
        previousMicros += micros;
      }
    }

    return {
      currentWeekMicros: currentMicros,
      lastWeekMicros: previousMicros,
      currencyCode: detectedCurrency,
    };
  }, [records, lastWeekStartIso]);

  const deltaMicros = currentWeekMicros - lastWeekMicros;
  const isPositiveDelta = deltaMicros >= 0;

  return (
    <StyledCard aria-label="Incassi settimana">
      <StyledHeader>
        <IconCoins size={18} />
        <StyledTitle>Incassi settimana</StyledTitle>
      </StyledHeader>

      {error !== null && error !== undefined ? (
        <StyledMutedLine>Impossibile caricare gli incassi.</StyledMutedLine>
      ) : (
        <>
          <StyledMainAmount>
            {loading && records.length === 0
              ? '—'
              : formatCurrency(currentWeekMicros, currencyCode)}
          </StyledMainAmount>
          <StyledComparison isPositive={isPositiveDelta}>
            {isPositiveDelta ? (
              <IconArrowUp size={14} />
            ) : (
              <IconArrowDown size={14} />
            )}
            {formatCurrency(Math.abs(deltaMicros), currencyCode)} vs settimana
            scorsa
          </StyledComparison>
          <StyledMutedLine>
            Settimana scorsa: {formatCurrency(lastWeekMicros, currencyCode)}
          </StyledMutedLine>
        </>
      )}
    </StyledCard>
  );
};

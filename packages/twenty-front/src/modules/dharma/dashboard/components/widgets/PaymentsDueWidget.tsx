import { useMemo } from 'react';

import {
  DHARMA_DASHBOARD_LIMITS,
  expenseWidgetGqlFields,
} from '@/dharma/dashboard/graphql/queries/findDharmaDashboardData';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { IconCreditCard } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// NOTE: dharmaExpenseEntry currently exposes only paidAt (no dueAt). The
// 14-day lookahead from the brief is approximated by listing every unpaid
// expense ordered by oldest createdAt — when a dueAt column lands we can
// tighten the filter to { dueAt: { lte: in14Days } }.

type ExpenseRecord = ObjectRecord & {
  id: string;
  description: string | null;
  amount: {
    amountMicros: number | string | null;
    currencyCode: string | null;
  } | null;
  paidAt: string | null;
  createdAt: string | null;
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

const StyledTotal = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledItem = styled.li`
  align-items: center;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledDescription = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledAmount = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const toMicros = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatCurrency = (
  micros: number,
  currencyCode: string | null,
): string => {
  const amountUnits = micros / MICRO_PER_UNIT;
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

export const PaymentsDueWidget = () => {
  const { records, loading, error } = useFindManyRecords<ExpenseRecord>({
    objectNameSingular: 'dharmaExpenseEntry',
    filter: {
      paidAt: { is: 'NULL' },
    },
    orderBy: [{ createdAt: 'AscNullsFirst' }],
    limit: DHARMA_DASHBOARD_LIMITS.paymentsDue,
    recordGqlFields: { ...expenseWidgetGqlFields, createdAt: true },
  });

  const { totalMicros, currencyCode } = useMemo(() => {
    let total = 0;
    let currency: string | null = null;
    for (const expense of records) {
      total += toMicros(expense.amount?.amountMicros);
      if (currency === null) {
        currency = expense.amount?.currencyCode ?? null;
      }
    }
    return { totalMicros: total, currencyCode: currency };
  }, [records]);

  return (
    <StyledCard aria-label="Pagamenti da fare">
      <StyledHeader>
        <IconCreditCard size={18} />
        <StyledTitle>Pagamenti da fare</StyledTitle>
      </StyledHeader>

      {error !== null && error !== undefined ? (
        <StyledEmptyState>Impossibile caricare le uscite.</StyledEmptyState>
      ) : loading && records.length === 0 ? (
        <StyledEmptyState>Caricamento…</StyledEmptyState>
      ) : records.length === 0 ? (
        <StyledEmptyState>Nessun pagamento aperto.</StyledEmptyState>
      ) : (
        <>
          <StyledTotal>{formatCurrency(totalMicros, currencyCode)}</StyledTotal>
          <StyledList>
            {records.slice(0, 5).map((expense) => (
              <StyledItem key={expense.id}>
                <StyledDescription>
                  {expense.description ?? 'Senza descrizione'}
                </StyledDescription>
                <StyledAmount>
                  {formatCurrency(
                    toMicros(expense.amount?.amountMicros),
                    expense.amount?.currencyCode ?? currencyCode,
                  )}
                </StyledAmount>
              </StyledItem>
            ))}
          </StyledList>
        </>
      )}
    </StyledCard>
  );
};

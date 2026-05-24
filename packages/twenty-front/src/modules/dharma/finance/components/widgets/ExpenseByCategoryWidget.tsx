import { useMemo } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type DharmaExpenseEntryRecord } from '@/dharma/finance/types/DharmaFinanceTypes';
import {
  formatCurrency,
  microsToUnits,
} from '@/dharma/finance/utils/formatCurrency';

type ExpenseByCategoryWidgetProps = {
  expenses: DharmaExpenseEntryRecord[];
};

type Bucket = {
  category: string;
  total: number;
  share: number;
};

const UNCATEGORIZED_LABEL = 'Senza categoria';

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledItemHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledCategoryLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledAmount = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTrack = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 6px;
  overflow: hidden;
  width: 100%;
`;

const StyledFill = styled.div<{ share: number }>`
  background: ${themeCssVariables.tag.background.blue};
  height: 100%;
  transition: width 0.2s ease;
  width: ${({ share }) => `${Math.min(100, Math.max(0, share * 100))}%`};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} 0;
  text-align: center;
`;

const aggregateExpenses = (
  expenses: DharmaExpenseEntryRecord[],
): { buckets: Bucket[]; total: number } => {
  const totals = new Map<string, number>();

  for (const entry of expenses) {
    const key = entry.expenseCategory ?? UNCATEGORIZED_LABEL;
    const previous = totals.get(key) ?? 0;
    totals.set(key, previous + microsToUnits(entry.amount?.amountMicros ?? 0));
  }

  const total = Array.from(totals.values()).reduce(
    (acc, value) => acc + value,
    0,
  );
  const buckets: Bucket[] = Array.from(totals.entries())
    .map(([category, value]) => ({
      category,
      total: value,
      share: total === 0 ? 0 : value / total,
    }))
    .sort((a, b) => b.total - a.total);

  return { buckets, total };
};

export const ExpenseByCategoryWidget = ({
  expenses,
}: ExpenseByCategoryWidgetProps) => {
  const { buckets, total } = useMemo(
    () => aggregateExpenses(expenses),
    [expenses],
  );

  return (
    <StyledCard>
      <StyledTitle>Uscite per categoria</StyledTitle>
      {buckets.length === 0 ? (
        <StyledEmpty>Nessuna uscita registrata questo mese.</StyledEmpty>
      ) : (
        <>
          <StyledList>
            {buckets.map((bucket) => (
              <StyledItem key={bucket.category}>
                <StyledItemHeader>
                  <StyledCategoryLabel>{bucket.category}</StyledCategoryLabel>
                  <StyledAmount>{formatCurrency(bucket.total)}</StyledAmount>
                </StyledItemHeader>
                <StyledTrack>
                  <StyledFill share={bucket.share} />
                </StyledTrack>
              </StyledItem>
            ))}
          </StyledList>
          <StyledItemHeader>
            <StyledCategoryLabel>Totale uscite</StyledCategoryLabel>
            <StyledAmount>{formatCurrency(total)}</StyledAmount>
          </StyledItemHeader>
        </>
      )}
    </StyledCard>
  );
};

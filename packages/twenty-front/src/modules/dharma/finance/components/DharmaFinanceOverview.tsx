import { useState } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { CassettiBalanceCard } from '@/dharma/finance/components/widgets/CassettiBalanceCard';
import { CollaboratorPayoutWidget } from '@/dharma/finance/components/widgets/CollaboratorPayoutWidget';
import { ExpenseByCategoryWidget } from '@/dharma/finance/components/widgets/ExpenseByCategoryWidget';
import { IncomeEntryDetailDrawer } from '@/dharma/finance/components/IncomeEntryDetailDrawer';
import { IncomeEntryList } from '@/dharma/finance/components/widgets/IncomeEntryList';
import { MonthlyKpiWidget } from '@/dharma/finance/components/widgets/MonthlyKpiWidget';
import { useFinanceData } from '@/dharma/finance/hooks/useFinanceData';
import { type DharmaIncomeEntryRecord } from '@/dharma/finance/types/DharmaFinanceTypes';

const StyledPageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[8]};
`;

const StyledSplitRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 2fr 1fr;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledErrorState = styled.div`
  background: ${themeCssVariables.tag.background.red};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.tag.text.red};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]};
`;

const formatCurrentMonth = (): string => {
  const formatter = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  });
  const formatted = formatter.format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const DharmaFinanceOverview = () => {
  const [selectedEntry, setSelectedEntry] =
    useState<DharmaIncomeEntryRecord | null>(null);

  const {
    loading,
    error,
    incomeEntries,
    expenseEntries,
    monthlyKpi,
    previousMonthlyKpi,
    balances,
    refetch,
  } = useFinanceData();

  return (
    <SubMenuTopBarContainer
      title={`Finance · ${formatCurrentMonth()}`}
      links={[{ children: 'Dharma' }, { children: 'Finance' }]}
    >
      <StyledPageBody>
        {error !== undefined && (
          <StyledErrorState>
            Errore caricamento dati finance: {error.message}
          </StyledErrorState>
        )}

        <CassettiBalanceCard balances={balances} />

        <MonthlyKpiWidget current={monthlyKpi} previous={previousMonthlyKpi} />

        <StyledSplitRow>
          <div>
            <StyledSectionTitle>Entrate del mese</StyledSectionTitle>
            <div style={{ marginTop: 12 }}>
              {loading && incomeEntries.length === 0 ? (
                <StyledState>Caricamento entrate…</StyledState>
              ) : (
                <IncomeEntryList
                  entries={incomeEntries}
                  onSelectEntry={setSelectedEntry}
                />
              )}
            </div>
          </div>
          <div>
            <CollaboratorPayoutWidget />
          </div>
        </StyledSplitRow>

        <ExpenseByCategoryWidget expenses={expenseEntries} />
      </StyledPageBody>

      <IncomeEntryDetailDrawer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onSaved={() => {
          refetch();
        }}
      />
    </SubMenuTopBarContainer>
  );
};

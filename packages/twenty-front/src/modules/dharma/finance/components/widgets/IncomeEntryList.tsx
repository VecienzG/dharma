import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type DharmaIncomeEntryRecord } from '@/dharma/finance/types/DharmaFinanceTypes';
import {
  formatCurrencyFromMicros,
  formatItalianDate,
} from '@/dharma/finance/utils/formatCurrency';

type IncomeEntryListProps = {
  entries: DharmaIncomeEntryRecord[];
  onSelectEntry: (entry: DharmaIncomeEntryRecord) => void;
};

type ChipVariant = 'red' | 'green' | 'blue' | 'yellow';

const StyledWrapper = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow: hidden;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTh = styled.th`
  background: ${themeCssVariables.background.secondary};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  text-transform: uppercase;
`;

const StyledTr = styled.tr`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledTd = styled.td`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  vertical-align: middle;
`;

const StyledChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledChip = styled.span<{ variant: ChipVariant }>`
  background: ${({ variant }) =>
    variant === 'red'
      ? themeCssVariables.tag.background.red
      : variant === 'green'
        ? themeCssVariables.tag.background.green
        : variant === 'blue'
          ? themeCssVariables.tag.background.blue
          : themeCssVariables.tag.background.yellow};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ variant }) =>
    variant === 'red'
      ? themeCssVariables.tag.text.red
      : variant === 'green'
        ? themeCssVariables.tag.text.green
        : variant === 'blue'
          ? themeCssVariables.tag.text.blue
          : themeCssVariables.tag.text.yellow};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledSecondary = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

export const IncomeEntryList = ({
  entries,
  onSelectEntry,
}: IncomeEntryListProps) => {
  if (entries.length === 0) {
    return (
      <StyledWrapper>
        <StyledEmpty>Nessuna entrata registrata questo mese.</StyledEmpty>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <StyledTable>
        <thead>
          <tr>
            <StyledTh>Data</StyledTh>
            <StyledTh>Cliente / Progetto</StyledTh>
            <StyledTh>Tipo</StyledTh>
            <StyledTh>Lordo</StyledTh>
            <StyledTh>Split (Tasse · BL · Personale)</StyledTh>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isInvoiced = entry.incomeType === 'INVOICED';
            return (
              <StyledTr
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                aria-label={`Apri dettaglio entrata ${entry.id}`}
              >
                <StyledTd>{formatItalianDate(entry.receivedAt)}</StyledTd>
                <StyledTd>
                  <div>{entry.company?.name ?? entry.description ?? '—'}</div>
                  {entry.dharmaProject?.name !== undefined && (
                    <StyledSecondary>
                      {entry.dharmaProject?.name}
                    </StyledSecondary>
                  )}
                </StyledTd>
                <StyledTd>
                  <StyledChip variant={isInvoiced ? 'blue' : 'yellow'}>
                    {isInvoiced ? 'Fatturato' : 'Cassa'}
                  </StyledChip>
                </StyledTd>
                <StyledTd>
                  {formatCurrencyFromMicros(entry.grossAmount?.amountMicros)}
                </StyledTd>
                <StyledTd>
                  <StyledChipGroup>
                    <StyledChip variant="red">
                      {formatCurrencyFromMicros(entry.taxAmount?.amountMicros)}
                    </StyledChip>
                    <StyledChip variant="green">
                      {formatCurrencyFromMicros(
                        entry.beautifulLifeAmount?.amountMicros,
                      )}
                    </StyledChip>
                    <StyledChip variant="blue">
                      {formatCurrencyFromMicros(
                        entry.personalAmount?.amountMicros,
                      )}
                    </StyledChip>
                  </StyledChipGroup>
                </StyledTd>
              </StyledTr>
            );
          })}
        </tbody>
      </StyledTable>
    </StyledWrapper>
  );
};

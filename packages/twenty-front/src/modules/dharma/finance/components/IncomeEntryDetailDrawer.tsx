import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { IconX } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { UPDATE_DHARMA_INCOME_ENTRY } from '@/dharma/finance/graphql/mutations/updateDharmaIncomeEntry';
import {
  type DharmaIncomeEntryRecord,
  type DharmaSplitConfig,
} from '@/dharma/finance/types/DharmaFinanceTypes';
import {
  formatCurrency,
  formatCurrencyFromMicros,
  formatItalianDate,
  microsToUnits,
} from '@/dharma/finance/utils/formatCurrency';

type IncomeEntryDetailDrawerProps = {
  entry: DharmaIncomeEntryRecord | null;
  onClose: () => void;
  onSaved?: () => void;
};

const DEFAULT_INVOICED_SPLIT: DharmaSplitConfig = {
  taxPercent: 35,
  blPercent: 30,
  personalPercent: 35,
};

const DEFAULT_CASH_SPLIT: DharmaSplitConfig = {
  taxPercent: 0,
  blPercent: 50,
  personalPercent: 50,
};

const StyledOverlay = styled.div`
  background: ${themeCssVariables.background.overlayPrimary};
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 9999;
`;

const StyledDrawer = styled.aside`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.light};
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 10000;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledClose = styled.button`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledMetaGrid = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: max-content 1fr;
  margin: 0;

  dt {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.xs};
    text-transform: uppercase;
  }

  dd {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.sm};
    margin: 0;
  }
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledFieldRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 120px 1fr 100px;
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledNumberInput = styled.input`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
  text-align: right;
  width: 100%;
`;

const StyledPreview = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  text-align: right;
`;

const StyledFooter = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${({ variant }) =>
    variant === 'primary'
      ? themeCssVariables.tag.background.blue
      : 'transparent'};
  border: 1px solid
    ${({ variant }) =>
      variant === 'primary'
        ? themeCssVariables.tag.background.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ variant }) =>
    variant === 'primary'
      ? themeCssVariables.tag.text.blue
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledWarning = styled.span`
  color: ${themeCssVariables.tag.text.yellow};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledError = styled.span`
  color: ${themeCssVariables.tag.text.red};
  font-size: ${themeCssVariables.font.size.xs};
`;

const resolveDefaultSplit = (
  entry: DharmaIncomeEntryRecord,
): DharmaSplitConfig => {
  if (entry.splitConfig !== null && entry.splitConfig !== undefined) {
    return entry.splitConfig;
  }
  return entry.incomeType === 'CASH'
    ? DEFAULT_CASH_SPLIT
    : DEFAULT_INVOICED_SPLIT;
};

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, Number.isNaN(value) ? 0 : value));

export const IncomeEntryDetailDrawer = ({
  entry,
  onClose,
  onSaved,
}: IncomeEntryDetailDrawerProps) => {
  const apolloCoreClient = useApolloCoreClient();
  const [split, setSplit] = useState<DharmaSplitConfig>(DEFAULT_INVOICED_SPLIT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [updateEntry, { loading: saving }] = useMutation(
    UPDATE_DHARMA_INCOME_ENTRY,
    { client: apolloCoreClient },
  );

  useEffect(() => {
    if (entry !== null) {
      setSplit(resolveDefaultSplit(entry));
      setErrorMessage(null);
    }
  }, [entry]);

  const totalPercent = useMemo(
    () => split.taxPercent + split.blPercent + split.personalPercent,
    [split],
  );

  const grossUnits = useMemo(
    () => microsToUnits(entry?.grossAmount?.amountMicros ?? 0),
    [entry],
  );

  const preview = useMemo(() => {
    const taxAmount = (grossUnits * split.taxPercent) / 100;
    const blAmount = (grossUnits * split.blPercent) / 100;
    const personalAmount = (grossUnits * split.personalPercent) / 100;
    return { taxAmount, blAmount, personalAmount };
  }, [grossUnits, split]);

  if (entry === null) {
    return null;
  }

  const handleChange =
    (field: keyof DharmaSplitConfig) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = clampPercent(Number(event.target.value));
      setSplit((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = async () => {
    setErrorMessage(null);
    if (totalPercent !== 100) {
      setErrorMessage('La somma delle percentuali deve essere 100%.');
      return;
    }
    try {
      await updateEntry({
        variables: {
          id: entry.id,
          input: { splitConfig: split },
        },
      });
      onSaved?.();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante il salvataggio',
      );
    }
  };

  return (
    <>
      <StyledOverlay onClick={onClose} aria-hidden />
      <StyledDrawer role="dialog" aria-label="Dettaglio entrata">
        <StyledHeader>
          <StyledTitle>Dettaglio entrata</StyledTitle>
          <StyledClose onClick={onClose} aria-label="Chiudi">
            <IconX size={18} />
          </StyledClose>
        </StyledHeader>

        <StyledBody>
          <StyledMetaGrid>
            <dt>Data</dt>
            <dd>{formatItalianDate(entry.receivedAt)}</dd>
            <dt>Tipo</dt>
            <dd>{entry.incomeType === 'CASH' ? 'Cassa' : 'Fatturato'}</dd>
            <dt>Lordo</dt>
            <dd>{formatCurrencyFromMicros(entry.grossAmount?.amountMicros)}</dd>
            {entry.invoiceNumber !== null && (
              <>
                <dt>Fattura</dt>
                <dd>{entry.invoiceNumber}</dd>
              </>
            )}
            {entry.company?.name !== undefined && (
              <>
                <dt>Cliente</dt>
                <dd>{entry.company?.name ?? '—'}</dd>
              </>
            )}
            {entry.dharmaProject?.name !== undefined && (
              <>
                <dt>Progetto</dt>
                <dd>{entry.dharmaProject?.name ?? '—'}</dd>
              </>
            )}
          </StyledMetaGrid>

          <StyledSection>
            <StyledSectionTitle>Split cassetti (override)</StyledSectionTitle>

            <StyledFieldRow>
              <StyledLabel htmlFor="split-tax">Tasse %</StyledLabel>
              <StyledNumberInput
                id="split-tax"
                type="number"
                min={0}
                max={100}
                value={split.taxPercent}
                onChange={handleChange('taxPercent')}
              />
              <StyledPreview>{formatCurrency(preview.taxAmount)}</StyledPreview>
            </StyledFieldRow>

            <StyledFieldRow>
              <StyledLabel htmlFor="split-bl">Beautiful Life %</StyledLabel>
              <StyledNumberInput
                id="split-bl"
                type="number"
                min={0}
                max={100}
                value={split.blPercent}
                onChange={handleChange('blPercent')}
              />
              <StyledPreview>{formatCurrency(preview.blAmount)}</StyledPreview>
            </StyledFieldRow>

            <StyledFieldRow>
              <StyledLabel htmlFor="split-personal">Personale %</StyledLabel>
              <StyledNumberInput
                id="split-personal"
                type="number"
                min={0}
                max={100}
                value={split.personalPercent}
                onChange={handleChange('personalPercent')}
              />
              <StyledPreview>
                {formatCurrency(preview.personalAmount)}
              </StyledPreview>
            </StyledFieldRow>

            {totalPercent !== 100 && (
              <StyledWarning>
                Totale: {totalPercent}% — deve essere 100% per salvare.
              </StyledWarning>
            )}

            {errorMessage !== null && <StyledError>{errorMessage}</StyledError>}
          </StyledSection>
        </StyledBody>

        <StyledFooter>
          <StyledButton onClick={onClose}>Annulla</StyledButton>
          <StyledButton
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving || totalPercent !== 100}
          >
            {saving ? 'Salvataggio…' : 'Salva split'}
          </StyledButton>
        </StyledFooter>
      </StyledDrawer>
    </>
  );
};

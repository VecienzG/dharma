import { styled } from '@linaria/react';
import { IconCoins, IconHeart, IconUser } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type DharmaCassettiBalances } from '@/dharma/finance/types/DharmaFinanceTypes';
import { formatCurrency } from '@/dharma/finance/utils/formatCurrency';

type CassettiBalanceCardProps = {
  balances: DharmaCassettiBalances;
};

type CassettoVariant = 'tax' | 'bl' | 'personal';

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCard = styled.div<{ variant: CassettoVariant }>`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow: hidden;
  padding: ${themeCssVariables.spacing[5]};
  position: relative;

  &::before {
    background: ${({ variant }) =>
      variant === 'tax'
        ? themeCssVariables.tag.background.red
        : variant === 'bl'
          ? themeCssVariables.tag.background.green
          : themeCssVariables.tag.background.blue};
    content: '';
    height: 4px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledIconWrapper = styled.span<{ variant: CassettoVariant }>`
  align-items: center;
  background: ${({ variant }) =>
    variant === 'tax'
      ? themeCssVariables.tag.background.red
      : variant === 'bl'
        ? themeCssVariables.tag.background.green
        : themeCssVariables.tag.background.blue};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ variant }) =>
    variant === 'tax'
      ? themeCssVariables.tag.text.red
      : variant === 'bl'
        ? themeCssVariables.tag.text.green
        : themeCssVariables.tag.text.blue};
  display: inline-flex;
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledAmount = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.1;
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

export const CassettiBalanceCard = ({ balances }: CassettiBalanceCardProps) => {
  return (
    <StyledGrid>
      <StyledCard variant="tax" aria-label="Cassetto Tasse">
        <StyledHeader>
          <StyledIconWrapper variant="tax">
            <IconCoins size={16} />
          </StyledIconWrapper>
          <StyledLabel>Tasse</StyledLabel>
        </StyledHeader>
        <StyledAmount>{formatCurrency(balances.taxTotal)}</StyledAmount>
        <StyledMeta>Accantonato mese corrente</StyledMeta>
      </StyledCard>

      <StyledCard variant="bl" aria-label="Cassetto Beautiful Life">
        <StyledHeader>
          <StyledIconWrapper variant="bl">
            <IconHeart size={16} />
          </StyledIconWrapper>
          <StyledLabel>Beautiful Life</StyledLabel>
        </StyledHeader>
        <StyledAmount>{formatCurrency(balances.blTotal)}</StyledAmount>
        <StyledMeta>
          Disponibile (post uscite): {formatCurrency(balances.blAvailable)}
        </StyledMeta>
      </StyledCard>

      <StyledCard variant="personal" aria-label="Cassetto Personale">
        <StyledHeader>
          <StyledIconWrapper variant="personal">
            <IconUser size={16} />
          </StyledIconWrapper>
          <StyledLabel>Personale</StyledLabel>
        </StyledHeader>
        <StyledAmount>{formatCurrency(balances.personalTotal)}</StyledAmount>
        <StyledMeta>Quota personale mese corrente</StyledMeta>
      </StyledCard>
    </StyledGrid>
  );
};

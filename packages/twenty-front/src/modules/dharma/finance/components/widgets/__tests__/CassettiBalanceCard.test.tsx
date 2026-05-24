import { render, screen } from '@testing-library/react';

import { CassettiBalanceCard } from '@/dharma/finance/components/widgets/CassettiBalanceCard';
import { type DharmaCassettiBalances } from '@/dharma/finance/types/DharmaFinanceTypes';

describe('CassettiBalanceCard', () => {
  const buildBalances = (
    override: Partial<DharmaCassettiBalances> = {},
  ): DharmaCassettiBalances => ({
    taxTotal: 350,
    blTotal: 300,
    personalTotal: 350,
    blAvailable: 200,
    ...override,
  });

  it('should render the three italian cassetti labels', () => {
    render(<CassettiBalanceCard balances={buildBalances()} />);

    expect(screen.getByText('Tasse')).toBeInTheDocument();
    expect(screen.getByText('Beautiful Life')).toBeInTheDocument();
    expect(screen.getByText('Personale')).toBeInTheDocument();
  });

  it('should display amounts formatted in italian EUR', () => {
    render(
      <CassettiBalanceCard
        balances={buildBalances({
          taxTotal: 1234.5,
          blTotal: 999.99,
          personalTotal: 0,
          blAvailable: 500,
        })}
      />,
    );

    // ICU thousand separator availability differs by env, so we match
    // the meaningful decimals only.
    expect(screen.getByLabelText('Cassetto Tasse')).toHaveTextContent(/234,50/);
    expect(screen.getByLabelText('Cassetto Beautiful Life')).toHaveTextContent(
      '999,99',
    );
    expect(screen.getByLabelText('Cassetto Personale')).toHaveTextContent(
      '0,00',
    );
  });

  it('should surface the bl available residual amount', () => {
    render(
      <CassettiBalanceCard balances={buildBalances({ blAvailable: 250 })} />,
    );

    expect(screen.getByLabelText('Cassetto Beautiful Life')).toHaveTextContent(
      'Disponibile',
    );
    expect(screen.getByLabelText('Cassetto Beautiful Life')).toHaveTextContent(
      '250,00',
    );
  });
});

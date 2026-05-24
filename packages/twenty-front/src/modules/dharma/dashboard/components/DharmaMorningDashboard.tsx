import { useMemo } from 'react';

import { DeadlinesWidget } from '@/dharma/dashboard/components/widgets/DeadlinesWidget';
import { DormantContactsWidget } from '@/dharma/dashboard/components/widgets/DormantContactsWidget';
import { PaymentsDueWidget } from '@/dharma/dashboard/components/widgets/PaymentsDueWidget';
import { PriorityAiWidget } from '@/dharma/dashboard/components/widgets/PriorityAiWidget';
import { RevenueWeekWidget } from '@/dharma/dashboard/components/widgets/RevenueWeekWidget';
import { styled } from '@linaria/react';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRoot = styled.div`
  background: ${themeCssVariables.background.noisy};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[8]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

const StyledHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledGreeting = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.02em;
  margin: 0;
`;

const StyledDate = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const getGreeting = (now: Date): string => {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Buongiorno';
  }
  if (hour < 18) {
    return 'Buon pomeriggio';
  }
  return 'Buonasera';
};

export const DharmaMorningDashboard = () => {
  const { greeting, formattedDate } = useMemo(() => {
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      greeting: getGreeting(now),
      formattedDate: dateFormatter.format(now),
    };
  }, []);

  return (
    <StyledRoot>
      <StyledHeader>
        <StyledGreeting>{greeting}</StyledGreeting>
        <StyledDate>{formattedDate}</StyledDate>
      </StyledHeader>

      <StyledGrid>
        <PriorityAiWidget />
        <RevenueWeekWidget />
        <DeadlinesWidget />
        <DormantContactsWidget />
        <PaymentsDueWidget />
      </StyledGrid>
    </StyledRoot>
  );
};

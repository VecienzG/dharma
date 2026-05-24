import { useMemo } from 'react';

import {
  DHARMA_DASHBOARD_LIMITS,
  DORMANT_INACTIVITY_DAYS,
  personWidgetGqlFields,
} from '@/dharma/dashboard/graphql/queries/findDharmaDashboardData';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { IconUsers } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type PersonRecord = ObjectRecord & {
  id: string;
  name: { firstName: string | null; lastName: string | null } | null;
  jobTitle: string | null;
  dharmaPriority: string | null;
  updatedAt: string | null;
};

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

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledItem = styled.li`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1 1 auto;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const formatFullName = (name: PersonRecord['name']): string => {
  if (!name) {
    return 'Contatto senza nome';
  }
  const parts = [name.firstName, name.lastName].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  return parts.length > 0 ? parts.join(' ') : 'Contatto senza nome';
};

const formatDaysSince = (isoDate: string | null, now: Date): string => {
  if (isoDate === null) {
    return 'Mai contattato';
  }
  const then = new Date(isoDate);
  const diffDays = Math.round(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) {
    return 'Oggi';
  }
  return `${diffDays}g senza contatto`;
};

export const DormantContactsWidget = () => {
  const now = useMemo(() => new Date(), []);
  const inactivityCutoff = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - DORMANT_INACTIVITY_DAYS);
    return cutoff.toISOString();
  }, [now]);

  // We approximate "no activity" with the standard updatedAt timestamp;
  // a richer activity-log filter can replace this when available.
  const { records, loading, error } = useFindManyRecords<PersonRecord>({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: {
      and: [
        { dharmaPriority: { eq: 'HIGH' } },
        { updatedAt: { lte: inactivityCutoff } },
      ],
    },
    orderBy: [{ updatedAt: 'AscNullsFirst' }],
    limit: DHARMA_DASHBOARD_LIMITS.dormantContacts,
    recordGqlFields: personWidgetGqlFields,
  });

  return (
    <StyledCard aria-label="Contatti da recuperare">
      <StyledHeader>
        <IconUsers size={18} />
        <StyledTitle>Da recuperare</StyledTitle>
      </StyledHeader>

      {error !== null && error !== undefined ? (
        <StyledEmptyState>Impossibile caricare i contatti.</StyledEmptyState>
      ) : loading && records.length === 0 ? (
        <StyledEmptyState>Caricamento…</StyledEmptyState>
      ) : records.length === 0 ? (
        <StyledEmptyState>
          Nessun contatto HIGH inattivo. Bel lavoro.
        </StyledEmptyState>
      ) : (
        <StyledList>
          {records.map((person) => (
            <StyledItem key={person.id}>
              <StyledName>{formatFullName(person.name)}</StyledName>
              <StyledMeta>{formatDaysSince(person.updatedAt, now)}</StyledMeta>
            </StyledItem>
          ))}
        </StyledList>
      )}
    </StyledCard>
  );
};

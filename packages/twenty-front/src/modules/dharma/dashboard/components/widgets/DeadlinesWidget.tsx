import { useMemo } from 'react';

import {
  DEADLINES_LOOKAHEAD_DAYS,
  DHARMA_DASHBOARD_LIMITS,
  taskWidgetGqlFields,
} from '@/dharma/dashboard/graphql/queries/findDharmaDashboardData';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { IconCalendar } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TaskRecord = ObjectRecord & {
  id: string;
  title: string | null;
  status: string | null;
  dueAt: string | null;
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
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding-bottom: ${themeCssVariables.spacing[2]};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const StyledTaskTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1 1 auto;
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDueAt = styled.span<{ isOverdue: boolean }>`
  color: ${({ isOverdue }) =>
    isOverdue
      ? themeCssVariables.color.red
      : themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const formatDueLabel = (
  isoDate: string,
  now: Date,
): { label: string; isOverdue: boolean } => {
  const due = new Date(isoDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const formatter = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
  });

  if (diffDays === 0) {
    return { label: 'Oggi', isOverdue: false };
  }
  if (diffDays === 1) {
    return { label: 'Domani', isOverdue: false };
  }
  if (isOverdue) {
    return { label: `In ritardo · ${formatter.format(due)}`, isOverdue: true };
  }
  return {
    label: `${formatter.format(due)} · fra ${diffDays}g`,
    isOverdue: false,
  };
};

export const DeadlinesWidget = () => {
  const now = useMemo(() => new Date(), []);
  const lookaheadEnd = useMemo(() => {
    const end = new Date(now);
    end.setDate(end.getDate() + DEADLINES_LOOKAHEAD_DAYS);
    return end.toISOString();
  }, [now]);

  const { records, loading, error } = useFindManyRecords<TaskRecord>({
    objectNameSingular: CoreObjectNameSingular.Task,
    filter: {
      and: [{ dueAt: { lte: lookaheadEnd } }, { dueAt: { is: 'NOT_NULL' } }],
    },
    orderBy: [{ dueAt: 'AscNullsFirst' }],
    limit: DHARMA_DASHBOARD_LIMITS.deadlines,
    recordGqlFields: taskWidgetGqlFields,
  });

  return (
    <StyledCard aria-label="Scadenze prossime">
      <StyledHeader>
        <IconCalendar size={18} />
        <StyledTitle>Scadenze (7 giorni)</StyledTitle>
      </StyledHeader>

      {error !== null && error !== undefined ? (
        <StyledEmptyState>Impossibile caricare le scadenze.</StyledEmptyState>
      ) : loading && records.length === 0 ? (
        <StyledEmptyState>Caricamento…</StyledEmptyState>
      ) : records.length === 0 ? (
        <StyledEmptyState>Nessuna scadenza imminente.</StyledEmptyState>
      ) : (
        <StyledList>
          {records.map((task) => {
            const dueIso = task.dueAt;
            const dueInfo =
              typeof dueIso === 'string'
                ? formatDueLabel(dueIso, now)
                : { label: 'Senza data', isOverdue: false };

            return (
              <StyledItem key={task.id}>
                <StyledTaskTitle>
                  {task.title ?? 'Task senza titolo'}
                </StyledTaskTitle>
                <StyledDueAt isOverdue={dueInfo.isOverdue}>
                  {dueInfo.label}
                </StyledDueAt>
              </StyledItem>
            );
          })}
        </StyledList>
      )}
    </StyledCard>
  );
};

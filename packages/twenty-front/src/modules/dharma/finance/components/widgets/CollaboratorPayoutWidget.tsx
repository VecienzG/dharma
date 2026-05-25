import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { IconCheck, IconUser } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { UPDATE_DHARMA_COLLABORATOR_PAYOUT } from '@/dharma/finance/graphql/mutations/updateDharmaCollaboratorPayout';
import {
  formatCurrencyFromMicros,
  formatItalianDate,
} from '@/dharma/finance/utils/formatCurrency';

type CollaboratorPayoutRecord = {
  id: string;
  __typename: string;
  feeAmount: {
    amountMicros: number | null;
    currencyCode: string | null;
  } | null;
  status: 'PENDING' | 'PAID' | null;
  paidAt: string | null;
  notes: string | null;
  name?: string | null;
  collaborator: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
  } | null;
  [key: string]: unknown;
};

const PAYOUT_GQL_FIELDS = {
  id: true,
  name: true,
  notes: true,
  status: true,
  paidAt: true,
  feeAmount: { amountMicros: true, currencyCode: true },
  collaborator: {
    id: true,
    name: { firstName: true, lastName: true },
  },
};

const formatCollaboratorName = (
  collaborator: CollaboratorPayoutRecord['collaborator'],
): string | null => {
  if (!collaborator || !collaborator.name) {
    return null;
  }
  const parts = [collaborator.name.firstName, collaborator.name.lastName]
    .filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    );
  return parts.length > 0 ? parts.join(' ') : null;
};

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledPending = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
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
  border-radius: ${themeCssVariables.border.radius.sm};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 28px 1fr auto auto;
  padding: ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledAvatar = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  border-radius: 999px;
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-flex;
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledLabel = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledFee = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledPayButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.tag.background.green};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.tag.text.green};
  cursor: pointer;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]} 0;
  text-align: center;
`;

const StyledError = styled.div`
  color: ${themeCssVariables.tag.text.red};
  font-size: ${themeCssVariables.font.size.xs};
`;

export const CollaboratorPayoutWidget = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(
    new Set(),
  );
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { records, loading, refetch } =
    useFindManyRecords<CollaboratorPayoutRecord>({
      objectNameSingular: 'dharmaCollaboratorPayout',
      filter: {
        status: { eq: 'PENDING' },
      },
      recordGqlFields: PAYOUT_GQL_FIELDS,
    });

  const [markPaid] = useMutation(UPDATE_DHARMA_COLLABORATOR_PAYOUT, {
    client: apolloCoreClient,
  });

  const pendingPayouts = useMemo(
    () => records.filter((record) => !optimisticPaidIds.has(record.id)),
    [records, optimisticPaidIds],
  );

  const totalPending = useMemo(
    () =>
      pendingPayouts.reduce(
        (acc, record) => acc + (record.feeAmount?.amountMicros ?? 0),
        0,
      ),
    [pendingPayouts],
  );

  const handleMarkPaid = async (payout: CollaboratorPayoutRecord) => {
    setMutationError(null);
    const nextOptimistic = new Set(optimisticPaidIds);
    nextOptimistic.add(payout.id);
    setOptimisticPaidIds(nextOptimistic);

    try {
      await markPaid({
        variables: {
          id: payout.id,
          input: {
            status: 'PAID',
            paidAt: new Date().toISOString().slice(0, 10),
          },
        },
      });
      void refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Errore sconosciuto';
      setMutationError(message);
      const rollback = new Set(optimisticPaidIds);
      rollback.delete(payout.id);
      setOptimisticPaidIds(rollback);
    }
  };

  return (
    <StyledCard>
      <StyledTitleRow>
        <StyledTitle>Collaboratori da pagare</StyledTitle>
        <StyledPending>
          {pendingPayouts.length} in sospeso ·{' '}
          {formatCurrencyFromMicros(totalPending)}
        </StyledPending>
      </StyledTitleRow>

      {mutationError !== null && <StyledError>{mutationError}</StyledError>}

      {loading ? (
        <StyledEmpty>Caricamento collaboratori…</StyledEmpty>
      ) : pendingPayouts.length === 0 ? (
        <StyledEmpty>Nessun pagamento collaboratore in sospeso.</StyledEmpty>
      ) : (
        <StyledList>
          {pendingPayouts.map((payout) => (
            <StyledItem key={payout.id}>
              <StyledAvatar>
                <IconUser size={14} />
              </StyledAvatar>
              <StyledLabel>
                <StyledName>
                  {formatCollaboratorName(payout.collaborator) ??
                    payout.name ??
                    payout.notes ??
                    'Collaboratore'}
                </StyledName>
                {payout.paidAt !== null && (
                  <StyledMeta>
                    Data prevista: {formatItalianDate(payout.paidAt)}
                  </StyledMeta>
                )}
              </StyledLabel>
              <StyledFee>
                {formatCurrencyFromMicros(payout.feeAmount?.amountMicros)}
              </StyledFee>
              <StyledPayButton
                onClick={() => void handleMarkPaid(payout)}
                aria-label={`Segna come pagato ${payout.id}`}
              >
                <IconCheck size={12} />
                Pagato
              </StyledPayButton>
            </StyledItem>
          ))}
        </StyledList>
      )}
    </StyledCard>
  );
};

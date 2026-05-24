import { SuggestionCard } from '@/dharma/ai/components/SuggestionCard';
import { SuggestionDetailDrawer } from '@/dharma/ai/components/SuggestionDetailDrawer';
import { SuggestionFilters } from '@/dharma/ai/components/SuggestionFilters';
import { useDharmaSuggestions } from '@/dharma/ai/hooks/useDharmaSuggestions';
import {
  type DharmaAiSuggestion,
  type DharmaAiSuggestionAction,
  type DharmaAiSuggestionFilters,
  type DharmaAiSuggestionStatus,
} from '@/dharma/ai/types/DharmaAi';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const ACCEPT_CONFIRMATION_MODAL_ID = 'dharma-ai-suggestion-accept';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  margin: 0 auto;
  max-width: 960px;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledEmpty = styled.div`
  border: 1px dashed ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const DEFAULT_FILTERS: DharmaAiSuggestionFilters = {
  status: 'PENDING',
  kind: 'ALL',
  source: 'ALL',
  minScore: 0,
};

export const DharmaAiInboxPage = () => {
  const [filters, setFilters] =
    useState<DharmaAiSuggestionFilters>(DEFAULT_FILTERS);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<DharmaAiSuggestion | null>(null);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);

  const statusForServer: DharmaAiSuggestionStatus | undefined =
    filters.status === 'ALL' ? undefined : filters.status;

  const { suggestions, loading, error, actOnSuggestion } = useDharmaSuggestions(
    {
      status: statusForServer,
      limit: 100,
    },
  );

  const { openModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter((suggestion) =>
        filters.kind === 'ALL' ? true : suggestion.kind === filters.kind,
      )
      .filter((suggestion) =>
        filters.source === 'ALL' ? true : suggestion.source === filters.source,
      )
      .filter((suggestion) => suggestion.score >= filters.minScore)
      .sort((left, right) => right.score - left.score);
  }, [suggestions, filters]);

  const handleAction = (
    suggestionId: string,
    action: DharmaAiSuggestionAction,
  ) => {
    if (action === 'accept') {
      setPendingAcceptId(suggestionId);
      openModal(ACCEPT_CONFIRMATION_MODAL_ID);
      return;
    }
    void executeAction(suggestionId, action);
  };

  const executeAction = async (
    suggestionId: string,
    action: DharmaAiSuggestionAction,
  ) => {
    try {
      await actOnSuggestion(suggestionId, action);
      enqueueSuccessSnackBar({
        message:
          action === 'reject'
            ? 'Suggerimento rifiutato — feedback registrato.'
            : action === 'dismiss'
              ? 'Suggerimento ignorato.'
              : 'Suggerimento accettato — il modello è stato aggiornato.',
      });
    } catch (caughtError) {
      enqueueErrorSnackBar({
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Operazione fallita',
      });
    }
  };

  const handleConfirmAccept = () => {
    if (pendingAcceptId === null) return;
    const idToAccept = pendingAcceptId;
    setPendingAcceptId(null);
    void executeAction(idToAccept, 'accept');
  };

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitle>Suggerimenti AI</StyledTitle>
        <StyledSubtitle>
          Esamina i suggerimenti generati dall'AI. Accettare addestra il modello
          sulle tue preferenze.
        </StyledSubtitle>
      </StyledHeader>

      <SuggestionFilters filters={filters} onChange={setFilters} />

      <StyledList>
        {loading && suggestions.length === 0 ? (
          <StyledEmpty>Caricamento suggerimenti...</StyledEmpty>
        ) : error !== null ? (
          <StyledEmpty>
            Errore: {error.message}. Riprova tra qualche istante.
          </StyledEmpty>
        ) : filteredSuggestions.length === 0 ? (
          <StyledEmpty>Nessun suggerimento con i filtri correnti.</StyledEmpty>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={handleAction}
              onSelect={setSelectedSuggestion}
            />
          ))
        )}
      </StyledList>

      <SuggestionDetailDrawer
        suggestion={selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
      />

      <ConfirmationModal
        modalInstanceId={ACCEPT_CONFIRMATION_MODAL_ID}
        title="Accettare il suggerimento?"
        subtitle="Questo addestra il modello: l'AI userà questa decisione come segnale di pattern positivo nelle prossime esecuzioni."
        confirmButtonText="Accetta e addestra"
        confirmButtonAccent="blue"
        onConfirmClick={handleConfirmAccept}
        onClose={() => setPendingAcceptId(null)}
      />
    </StyledPage>
  );
};

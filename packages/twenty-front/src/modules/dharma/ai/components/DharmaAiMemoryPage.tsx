import { MemoryCard } from '@/dharma/ai/components/MemoryCard';
import { MemoryEditorDrawer } from '@/dharma/ai/components/MemoryEditorDrawer';
import { useDharmaMemory } from '@/dharma/ai/hooks/useDharmaMemory';
import {
  type DharmaAiMemory,
  type DharmaAiMemoryKind,
} from '@/dharma/ai/types/DharmaAi';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { IconPlus } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const DELETE_MEMORY_MODAL_ID = 'dharma-ai-memory-delete';

const KIND_GROUP_LABEL: Record<DharmaAiMemoryKind, string> = {
  FACT: 'Fatti',
  RULE: 'Regole',
  PREFERENCE: 'Preferenze',
  PATTERN: 'Pattern appresi',
};

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  margin: 0 auto;
  max-width: 1080px;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledHeader = styled.header`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
`;

const StyledHeading = styled.div`
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

const StyledGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledGroupTitle = styled.h2`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
  text-transform: uppercase;
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const StyledEmpty = styled.div`
  border: 1px dashed ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

export const DharmaAiMemoryPage = () => {
  const { memories, loading, createMemory, updateMemory, deleteMemory } =
    useDharmaMemory();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<DharmaAiMemory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DharmaAiMemory | null>(
    null,
  );
  const { openModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const handleCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const handleEdit = (memory: DharmaAiMemory) => {
    setEditing(memory);
    setEditorOpen(true);
  };

  const handleDelete = (memory: DharmaAiMemory) => {
    setPendingDelete(memory);
    openModal(DELETE_MEMORY_MODAL_ID);
  };

  const handleSubmitEditor = async (input: {
    kind: DharmaAiMemoryKind;
    content: string;
    tags: string[];
    score: number;
  }) => {
    try {
      if (editing === null) {
        await createMemory({
          ...input,
          source: 'MANUAL',
          lastUsedAt: null,
        });
        enqueueSuccessSnackBar({ message: 'Memoria creata.' });
      } else {
        await updateMemory(editing.id, input);
        enqueueSuccessSnackBar({ message: 'Memoria aggiornata.' });
      }
    } catch (caughtError) {
      enqueueErrorSnackBar({
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Operazione fallita',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteMemory(target.id);
      enqueueSuccessSnackBar({ message: 'Memoria eliminata.' });
    } catch (caughtError) {
      enqueueErrorSnackBar({
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Eliminazione fallita',
      });
    }
  };

  const kindOrder: DharmaAiMemoryKind[] = [
    'PREFERENCE',
    'RULE',
    'PATTERN',
    'FACT',
  ];

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>
          <StyledTitle>Memoria AI</StyledTitle>
          <StyledSubtitle>
            Fatti, regole, preferenze e pattern che il modello usa per generare
            suggerimenti più rilevanti.
          </StyledSubtitle>
        </StyledHeading>
        <Button
          variant="primary"
          accent="blue"
          Icon={IconPlus}
          title="Aggiungi memoria"
          onClick={handleCreate}
        />
      </StyledHeader>

      {loading && memories.length === 0 ? (
        <StyledEmpty>Caricamento memorie...</StyledEmpty>
      ) : memories.length === 0 ? (
        <StyledEmpty>
          Nessuna memoria registrata. Aggiungine una per guidare l'AI.
        </StyledEmpty>
      ) : (
        kindOrder.map((kind) => {
          const group = memories.filter((memory) => memory.kind === kind);
          if (group.length === 0) return null;
          return (
            <StyledGroup key={kind}>
              <StyledGroupTitle>{KIND_GROUP_LABEL[kind]}</StyledGroupTitle>
              <StyledGrid>
                {group.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </StyledGrid>
            </StyledGroup>
          );
        })
      )}

      <MemoryEditorDrawer
        open={editorOpen}
        initialMemory={editing}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmitEditor}
      />

      <ConfirmationModal
        modalInstanceId={DELETE_MEMORY_MODAL_ID}
        title="Eliminare la memoria?"
        subtitle="Questa azione non può essere annullata. L'AI smetterà di usarla nelle prossime esecuzioni."
        confirmButtonText="Elimina"
        confirmButtonAccent="danger"
        onConfirmClick={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </StyledPage>
  );
};

import {
  type DharmaAiMemory,
  type DharmaAiMemoryKind,
} from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { IconEdit, IconTrash } from 'twenty-ui/display';
import { Tag, type TagColor } from 'twenty-ui/components';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type MemoryCardProps = {
  memory: DharmaAiMemory;
  onEdit: (memory: DharmaAiMemory) => void;
  onDelete: (memory: DharmaAiMemory) => void;
};

const KIND_TAG_COLOR: Record<DharmaAiMemoryKind, TagColor> = {
  FACT: 'sky',
  RULE: 'orange',
  PREFERENCE: 'purple',
  PATTERN: 'green',
};

const KIND_LABEL: Record<DharmaAiMemoryKind, string> = {
  FACT: 'Fatto',
  RULE: 'Regola',
  PREFERENCE: 'Preferenza',
  PATTERN: 'Pattern',
};

const StyledCard = styled.article`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledContent = styled.p`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
  white-space: pre-wrap;
`;

const StyledTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFooter = styled.footer`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const formatRelative = (iso: string | null): string => {
  if (iso === null) return 'mai usato';
  try {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 1) return 'appena ora';
    if (diffMinutes < 60) return `${diffMinutes} min fa`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h fa`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} g fa`;
  } catch {
    return iso;
  }
};

export const MemoryCard = ({ memory, onEdit, onDelete }: MemoryCardProps) => {
  return (
    <StyledCard data-testid="memory-card">
      <StyledHeader>
        <Tag
          color={KIND_TAG_COLOR[memory.kind]}
          text={KIND_LABEL[memory.kind]}
        />
        <StyledActions>
          <Button
            variant="tertiary"
            Icon={IconEdit}
            onClick={() => onEdit(memory)}
            ariaLabel="Modifica memoria"
          />
          <Button
            variant="tertiary"
            accent="danger"
            Icon={IconTrash}
            onClick={() => onDelete(memory)}
            ariaLabel="Elimina memoria"
          />
        </StyledActions>
      </StyledHeader>

      <StyledContent>{memory.content}</StyledContent>

      {memory.tags.length > 0 ? (
        <StyledTagRow>
          {memory.tags.map((tag) => (
            <Tag key={tag} color="transparent" variant="border" text={tag} />
          ))}
        </StyledTagRow>
      ) : null}

      <StyledFooter>
        <span>Punteggio: {memory.score.toFixed(2)}</span>
        <span>Usata: {formatRelative(memory.lastUsedAt)}</span>
      </StyledFooter>
    </StyledCard>
  );
};

import {
  type DharmaAiMemory,
  type DharmaAiMemoryKind,
} from '@/dharma/ai/types/DharmaAi';
import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { IconX } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type MemoryEditorDrawerProps = {
  open: boolean;
  initialMemory: DharmaAiMemory | null;
  onClose: () => void;
  onSubmit: (input: {
    kind: DharmaAiMemoryKind;
    content: string;
    tags: string[];
    score: number;
  }) => Promise<void> | void;
};

const KIND_OPTIONS: Array<{ value: DharmaAiMemoryKind; label: string }> = [
  { value: 'FACT', label: 'Fatto' },
  { value: 'RULE', label: 'Regola' },
  { value: 'PREFERENCE', label: 'Preferenza' },
  { value: 'PATTERN', label: 'Pattern' },
];

const StyledOverlay = styled.div`
  background: ${themeCssVariables.background.overlayPrimary};
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 100;
`;

const StyledDrawer = styled.aside`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 101;
`;

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledForm = styled.form`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  text-transform: uppercase;
`;

const StyledTextArea = styled.textarea`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 140px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
`;

const StyledTextInput = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledSliderRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledScoreValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xs};
  min-width: ${themeCssVariables.spacing[8]};
  text-align: right;
`;

const StyledFooter = styled.footer`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[4]};
`;

const parseTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

export const MemoryEditorDrawer = ({
  open,
  initialMemory,
  onClose,
  onSubmit,
}: MemoryEditorDrawerProps) => {
  const [kind, setKind] = useState<DharmaAiMemoryKind>('PREFERENCE');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [score, setScore] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialMemory?.kind ?? 'PREFERENCE');
    setContent(initialMemory?.content ?? '');
    setTagsInput((initialMemory?.tags ?? []).join(', '));
    setScore(initialMemory?.score ?? 0.5);
  }, [open, initialMemory]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (content.trim().length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        kind,
        content: content.trim(),
        tags: parseTags(tagsInput),
        score,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StyledOverlay onClick={onClose} />
      <StyledDrawer role="dialog" aria-label="Editor memoria AI">
        <StyledHeader>
          <StyledTitle>
            {initialMemory === null ? 'Aggiungi memoria' : 'Modifica memoria'}
          </StyledTitle>
          <Button
            variant="tertiary"
            Icon={IconX}
            onClick={onClose}
            ariaLabel="Chiudi"
          />
        </StyledHeader>

        <StyledForm onSubmit={handleSubmit}>
          <StyledField>
            <StyledLabel htmlFor="memory-kind">Tipo</StyledLabel>
            <StyledSelect
              id="memory-kind"
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as DharmaAiMemoryKind)
              }
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StyledSelect>
          </StyledField>

          <StyledField>
            <StyledLabel htmlFor="memory-content">Contenuto</StyledLabel>
            <StyledTextArea
              id="memory-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Es. Cliente X preferisce essere contattato il lunedì mattina"
              required
            />
          </StyledField>

          <StyledField>
            <StyledLabel htmlFor="memory-tags">
              Tag (separati da virgola)
            </StyledLabel>
            <StyledTextInput
              id="memory-tags"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="cliente, ritmo, telefonate"
            />
          </StyledField>

          <StyledField>
            <StyledLabel htmlFor="memory-score">Punteggio</StyledLabel>
            <StyledSliderRow>
              <input
                id="memory-score"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
                style={{ flex: '1 1 auto' }}
              />
              <StyledScoreValue>{score.toFixed(2)}</StyledScoreValue>
            </StyledSliderRow>
          </StyledField>

          <StyledFooter>
            <Button
              variant="secondary"
              title="Annulla"
              onClick={onClose}
              type="button"
            />
            <Button
              variant="primary"
              accent="blue"
              type="submit"
              title={initialMemory === null ? 'Crea' : 'Salva'}
              disabled={submitting || content.trim().length === 0}
            />
          </StyledFooter>
        </StyledForm>
      </StyledDrawer>
    </>
  );
};

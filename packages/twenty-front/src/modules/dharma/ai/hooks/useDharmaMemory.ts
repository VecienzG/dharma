import { type DharmaAiMemory } from '@/dharma/ai/types/DharmaAi';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useMemo } from 'react';

const DHARMA_AI_MEMORY_OBJECT_NAME = 'dharmaAiMemory';

// Field projection mirrors the Phase 4 seed schema in
//   packages/twenty-server/src/modules/dharma/workspace-seeder/seeds/objects/
const DHARMA_AI_MEMORY_GQL_FIELDS = {
  id: true,
  kind: true,
  content: true,
  tags: true,
  score: true,
  lastUsedAt: true,
  source: true,
  createdAt: true,
  updatedAt: true,
};

type DharmaAiMemoryInput = Partial<Omit<DharmaAiMemory, 'id'>>;

export const useDharmaMemory = () => {
  const { records, loading, refetch } = useFindManyRecords({
    objectNameSingular: DHARMA_AI_MEMORY_OBJECT_NAME,
    recordGqlFields: DHARMA_AI_MEMORY_GQL_FIELDS,
  });

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: DHARMA_AI_MEMORY_OBJECT_NAME,
    recordGqlFields: DHARMA_AI_MEMORY_GQL_FIELDS,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: DHARMA_AI_MEMORY_OBJECT_NAME,
  });

  const memories = useMemo<DharmaAiMemory[]>(
    () =>
      records.map((record) => ({
        id: String(record.id),
        kind: record.kind as DharmaAiMemory['kind'],
        content: String(record.content ?? ''),
        tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
        score: typeof record.score === 'number' ? record.score : 0,
        lastUsedAt:
          typeof record.lastUsedAt === 'string' ? record.lastUsedAt : null,
        source: (record.source ?? 'MANUAL') as DharmaAiMemory['source'],
        createdAt:
          typeof record.createdAt === 'string' ? record.createdAt : undefined,
        updatedAt:
          typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
      })),
    [records],
  );

  const createMemory = async (input: DharmaAiMemoryInput) =>
    createOneRecord(input as Partial<ObjectRecord>);

  const updateMemory = async (memoryId: string, input: DharmaAiMemoryInput) =>
    updateOneRecord({
      objectNameSingular: DHARMA_AI_MEMORY_OBJECT_NAME,
      idToUpdate: memoryId,
      updateOneRecordInput: input as Partial<Omit<ObjectRecord, 'id'>>,
      recordGqlFields: DHARMA_AI_MEMORY_GQL_FIELDS,
    });

  const deleteMemory = async (memoryId: string) => deleteOneRecord(memoryId);

  return {
    memories,
    loading,
    refetch,
    createMemory,
    updateMemory,
    deleteMemory,
  };
};

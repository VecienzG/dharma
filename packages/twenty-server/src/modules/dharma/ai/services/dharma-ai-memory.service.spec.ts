import { Test, type TestingModule } from '@nestjs/testing';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type DharmaAiMemoryRecord } from 'src/modules/dharma/ai/types/dharma-ai.types';

import { DharmaAiMemoryService } from './dharma-ai-memory.service';

const WORKSPACE_ID = 'ws_test_1';

const buildRepoMock = () => ({
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('DharmaAiMemoryService', () => {
  let service: DharmaAiMemoryService;
  let repoMock: ReturnType<typeof buildRepoMock>;
  let ormManager: { getRepository: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    repoMock = buildRepoMock();
    ormManager = { getRepository: jest.fn().mockResolvedValue(repoMock) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DharmaAiMemoryService,
        { provide: GlobalWorkspaceOrmManager, useValue: ormManager },
      ],
    }).compile();

    service = module.get(DharmaAiMemoryService);
  });

  describe('createMemory()', () => {
    it('should persist memory with default score and source when omitted', async () => {
      const saved: DharmaAiMemoryRecord = {
        id: 'mem_1',
        kind: 'FACT',
        content: 'hello',
        tags: [],
        score: 0.5,
        lastUsedAt: new Date(),
        source: 'INFERRED',
      };

      repoMock.save.mockResolvedValueOnce(saved);

      const result = await service.createMemory({
        workspaceId: WORKSPACE_ID,
        kind: 'FACT',
        content: 'hello',
      });

      expect(result).toEqual(saved);
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'FACT',
          content: 'hello',
          tags: [],
          score: 0.5,
          source: 'INFERRED',
        }),
      );
    });

    it('should unwrap array result returned by repo.save', async () => {
      const saved: DharmaAiMemoryRecord = {
        id: 'mem_2',
        kind: 'PATTERN',
        content: 'p',
        tags: ['x'],
        score: 0.8,
        lastUsedAt: new Date(),
        source: 'USER_FEEDBACK',
      };

      repoMock.save.mockResolvedValueOnce([saved]);

      const result = await service.createMemory({
        workspaceId: WORKSPACE_ID,
        kind: 'PATTERN',
        content: 'p',
        tags: ['x'],
        score: 0.8,
        source: 'USER_FEEDBACK',
      });

      expect(result).toEqual(saved);
    });
  });

  describe('findByTags()', () => {
    it('should return empty array when no tags requested', async () => {
      const result = await service.findByTags({
        workspaceId: WORKSPACE_ID,
        tags: [],
      });

      expect(result).toEqual([]);
      expect(repoMock.find).not.toHaveBeenCalled();
    });

    it('should filter memories whose tags intersect the requested set (case-insensitive)', async () => {
      const memories: DharmaAiMemoryRecord[] = [
        {
          id: '1',
          kind: 'FACT',
          content: 'a',
          tags: ['Followup'],
          score: 0.5,
          lastUsedAt: new Date(),
          source: 'INFERRED',
        },
        {
          id: '2',
          kind: 'FACT',
          content: 'b',
          tags: ['payment'],
          score: 0.5,
          lastUsedAt: new Date(),
          source: 'INFERRED',
        },
        {
          id: '3',
          kind: 'FACT',
          content: 'c',
          tags: null,
          score: 0.5,
          lastUsedAt: new Date(),
          source: 'INFERRED',
        },
      ];

      repoMock.find.mockResolvedValueOnce(memories);

      const result = await service.findByTags({
        workspaceId: WORKSPACE_ID,
        tags: ['FOLLOWUP'],
      });

      expect(result.map((memory) => memory.id)).toEqual(['1']);
    });
  });

  describe('touchUsage()', () => {
    it('should update lastUsedAt on the target memory', async () => {
      await service.touchUsage({
        workspaceId: WORKSPACE_ID,
        memoryId: 'mem_42',
      });

      expect(repoMock.update).toHaveBeenCalledWith(
        { id: 'mem_42' },
        expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      );
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';
import { type DharmaAiSuggestionRecord } from 'src/modules/dharma/ai/types/dharma-ai.types';

import { DharmaAiFeedbackService } from './dharma-ai-feedback.service';

const WORKSPACE_ID = 'ws_feedback';

describe('DharmaAiFeedbackService', () => {
  let service: DharmaAiFeedbackService;
  let repoMock: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let memoryService: { createMemory: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    repoMock = { findOne: jest.fn(), update: jest.fn() };
    memoryService = {
      createMemory: jest.fn().mockResolvedValue({ id: 'mem_created' }),
    };

    const ormManager = {
      getRepository: jest.fn().mockResolvedValue(repoMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DharmaAiFeedbackService,
        { provide: GlobalWorkspaceOrmManager, useValue: ormManager },
        { provide: DharmaAiMemoryService, useValue: memoryService },
      ],
    }).compile();

    service = module.get(DharmaAiFeedbackService);
  });

  it('should throw NotFoundException when suggestion missing', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);

    await expect(
      service.resolve({
        workspaceId: WORKSPACE_ID,
        suggestionId: 'missing',
        status: 'ACCEPTED',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create PATTERN memory on ACCEPTED with score 0.8', async () => {
    const suggestion: DharmaAiSuggestionRecord = {
      id: 's1',
      kind: 'FOLLOWUP',
      title: 'Reach out to John',
      body: '',
      payload: null,
      status: 'PENDING',
      score: 0.7,
      source: 'RULES',
      modelUsed: null,
      generatedAt: new Date(),
      resolvedAt: null,
    };

    repoMock.findOne.mockResolvedValueOnce(suggestion);

    const result = await service.resolve({
      workspaceId: WORKSPACE_ID,
      suggestionId: 's1',
      status: 'ACCEPTED',
      comment: 'good idea',
    });

    expect(repoMock.update).toHaveBeenCalledWith(
      { id: 's1' },
      expect.objectContaining({ status: 'ACCEPTED' }),
    );
    expect(memoryService.createMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'PATTERN',
        score: 0.8,
        source: 'USER_FEEDBACK',
        tags: ['followup', 'accepted'],
      }),
    );
    expect(result.memoryCreatedId).toBe('mem_created');
  });

  it('should create RULE memory on REJECTED with score 0.6', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 's2',
      kind: 'PAYMENT',
      title: 'Pay X',
      body: '',
      payload: null,
      status: 'PENDING',
      score: 0.6,
      source: 'RULES',
      modelUsed: null,
      generatedAt: new Date(),
      resolvedAt: null,
    } satisfies DharmaAiSuggestionRecord);

    await service.resolve({
      workspaceId: WORKSPACE_ID,
      suggestionId: 's2',
      status: 'REJECTED',
    });

    expect(memoryService.createMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'RULE',
        score: 0.6,
        tags: ['payment', 'rejected'],
      }),
    );
  });

  it('should not create memory on DISMISSED', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 's3',
      kind: 'INSIGHT',
      title: '',
      body: '',
      payload: null,
      status: 'PENDING',
      score: 0.5,
      source: 'LLM',
      modelUsed: 'claude-haiku',
      generatedAt: new Date(),
      resolvedAt: null,
    } satisfies DharmaAiSuggestionRecord);

    const result = await service.resolve({
      workspaceId: WORKSPACE_ID,
      suggestionId: 's3',
      status: 'DISMISSED',
    });

    expect(memoryService.createMemory).not.toHaveBeenCalled();
    expect(result.memoryCreatedId).toBeNull();
  });
});

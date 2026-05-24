import { Test, type TestingModule } from '@nestjs/testing';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaAiContextService } from 'src/modules/dharma/ai/services/dharma-ai-context.service';
import { DharmaAiRulesService } from 'src/modules/dharma/ai/services/dharma-ai-rules.service';
import {
  type DharmaAiSignal,
  SCORE_HIGH,
  SCORE_MEDIUM,
} from 'src/modules/dharma/ai/types/dharma-ai.types';
import { DharmaNotificationsService } from 'src/modules/dharma/notifications/services/dharma-notifications.service';

import { DharmaAiOrchestratorService } from './dharma-ai-orchestrator.service';

const WORKSPACE_ID = 'ws_orch';

const mockGenerateObject = jest.fn();

jest.mock('ai', () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: (model: string) => ({ providerModel: model }),
}));

describe('DharmaAiOrchestratorService', () => {
  let service: DharmaAiOrchestratorService;
  let rulesService: { evaluate: jest.Mock };
  let contextService: { snapshot: jest.Mock };
  let notificationsService: { send: jest.Mock };
  let suggestionRepo: { save: jest.Mock };

  const buildSignal = (
    overrides: Partial<DharmaAiSignal> = {},
  ): DharmaAiSignal => ({
    kind: 'TASK_PRIORITY',
    title: 'High',
    body: 'b',
    payload: {},
    score: SCORE_HIGH,
    source: 'RULES',
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;

    rulesService = { evaluate: jest.fn().mockResolvedValue([]) };
    contextService = {
      snapshot: jest.fn().mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        generatedAt: new Date().toISOString(),
        finance: {
          period: '2026-05',
          grossIncome: 0,
          blAvailable: 0,
          taxCassetto: 0,
          pendingPayouts: 0,
        },
        projects: { activeCount: 0, blockedCount: 0, overdueCount: 0 },
        contacts: { totalActive: 0, staleFollowUpCount: 0 },
        recentMemories: [],
      }),
    };
    notificationsService = {
      send: jest.fn().mockResolvedValue({ sent: 1 }),
    };
    suggestionRepo = {
      save: jest.fn().mockImplementation(async (entries) =>
        (entries as Array<Record<string, unknown>>).map(
          (entry, index) => ({ id: `sug_${index}`, ...entry }),
        ),
      ),
    };

    const ormManager = {
      getRepository: jest.fn().mockResolvedValue(suggestionRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DharmaAiOrchestratorService,
        { provide: GlobalWorkspaceOrmManager, useValue: ormManager },
        { provide: DharmaAiRulesService, useValue: rulesService },
        { provide: DharmaAiContextService, useValue: contextService },
        { provide: DharmaNotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(DharmaAiOrchestratorService);
  });

  it('should skip LLM when ANTHROPIC_API_KEY is missing', async () => {
    rulesService.evaluate.mockResolvedValueOnce([buildSignal()]);

    const result = await service.run({ workspaceId: WORKSPACE_ID });

    expect(mockGenerateObject).not.toHaveBeenCalled();
    expect(result.llmSignalsCount).toBe(0);
    expect(result.rulesSignalsCount).toBe(1);
    expect(result.persistedSuggestionIds).toEqual(['sug_0']);
  });

  it('should skip LLM when rulesOnly=true even if key is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';

    await service.run({ workspaceId: WORKSPACE_ID, rulesOnly: true });

    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it('should dispatch notifications only for signals with score >= SCORE_HIGH', async () => {
    rulesService.evaluate.mockResolvedValueOnce([
      buildSignal({ score: SCORE_HIGH, title: 'high' }),
      buildSignal({ score: SCORE_MEDIUM, title: 'medium' }),
    ]);

    const result = await service.run({ workspaceId: WORKSPACE_ID });

    expect(notificationsService.send).toHaveBeenCalledTimes(1);
    expect(notificationsService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          title: 'high',
          sourceKind: 'AI',
          sourceRecordId: 'sug_0',
        }),
      }),
    );
    expect(result.notificationsDispatched).toBe(1);
  });

  it('should call LLM with reasoning model when useReasoningModel=true', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    mockGenerateObject.mockResolvedValueOnce({
      object: { suggestions: [] },
    });

    const result = await service.run({
      workspaceId: WORKSPACE_ID,
      useReasoningModel: true,
    });

    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { providerModel: 'claude-sonnet-4-6' },
      }),
    );
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
  });

  it('should swallow LLM errors and return rules signals only', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    mockGenerateObject.mockRejectedValueOnce(new Error('rate limited'));
    rulesService.evaluate.mockResolvedValueOnce([buildSignal()]);

    const result = await service.run({ workspaceId: WORKSPACE_ID });

    expect(result.llmSignalsCount).toBe(0);
    expect(result.rulesSignalsCount).toBe(1);
  });
});

import { Test, type TestingModule } from '@nestjs/testing';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';

import { DharmaAiContextService } from './dharma-ai-context.service';

const WORKSPACE_ID = 'ws_context';

describe('DharmaAiContextService', () => {
  let service: DharmaAiContextService;
  let ormManager: { getRepository: jest.Mock };
  let financeKpi: { computeKpi: jest.Mock };
  let memoryService: { findRecent: jest.Mock };

  const buildRepoFor = (rows: unknown[]) => ({
    find: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    ormManager = {
      getRepository: jest.fn().mockImplementation(async (_ws, entityName) => {
        if (entityName === 'dharmaProject') {
          return buildRepoFor([
            { id: 'p1', status: 'ACTIVE', endDate: null },
            { id: 'p2', status: 'BLOCKED', endDate: null },
            {
              id: 'p3',
              status: 'ACTIVE',
              endDate: new Date(Date.now() - 86_400_000).toISOString(),
            },
          ]);
        }

        if (entityName === 'person') {
          return buildRepoFor([
            {
              id: 'c1',
              dharmaEntityType: 'CLIENT',
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'c2',
              dharmaEntityType: 'CLIENT',
              updatedAt: '2020-01-01T00:00:00Z',
            },
            { id: 's1', dharmaEntityType: 'SUPPLIER', updatedAt: null },
          ]);
        }

        if (entityName === 'dharmaCollaboratorPayout') {
          return buildRepoFor([
            { id: 'pay1', status: 'PENDING', feeAmount: { amountMicros: 100_000_000 } }, // €100
            { id: 'pay2', status: 'PAID', feeAmount: { amountMicros: 200_000_000 } },
          ]);
        }

        return buildRepoFor([]);
      }),
    };

    financeKpi = {
      computeKpi: jest.fn().mockResolvedValue({
        period: '2026-05',
        grossIncome: 5000,
        blAvailable: 1500,
        taxCassetto: 1750,
      }),
    };

    memoryService = {
      findRecent: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DharmaAiContextService,
        { provide: GlobalWorkspaceOrmManager, useValue: ormManager },
        { provide: DharmaFinanceKpiService, useValue: financeKpi },
        { provide: DharmaAiMemoryService, useValue: memoryService },
      ],
    }).compile();

    service = module.get(DharmaAiContextService);
  });

  it('should aggregate counts from raw repository rows', async () => {
    const context = await service.snapshot({ workspaceId: WORKSPACE_ID });

    expect(context.projects).toEqual({
      activeCount: 2, // p1 + p3
      blockedCount: 1,
      overdueCount: 1, // p3
    });
    expect(context.contacts.totalActive).toBe(2); // 2 CLIENT
    expect(context.contacts.staleFollowUpCount).toBe(1); // c2 old + null treated stale? c1 fresh
    expect(context.finance.pendingPayouts).toBe(100);
    expect(context.finance.blAvailable).toBe(1500);
  });

  it('should serve from cache on second call within TTL', async () => {
    await service.snapshot({ workspaceId: WORKSPACE_ID });
    await service.snapshot({ workspaceId: WORKSPACE_ID });

    expect(financeKpi.computeKpi).toHaveBeenCalledTimes(1);
  });

  it('should bypass cache when bypassCache=true', async () => {
    await service.snapshot({ workspaceId: WORKSPACE_ID });
    await service.snapshot({ workspaceId: WORKSPACE_ID, bypassCache: true });

    expect(financeKpi.computeKpi).toHaveBeenCalledTimes(2);
  });

  it('should rebuild after invalidate()', async () => {
    await service.snapshot({ workspaceId: WORKSPACE_ID });
    service.invalidate({ workspaceId: WORKSPACE_ID });
    await service.snapshot({ workspaceId: WORKSPACE_ID });

    expect(financeKpi.computeKpi).toHaveBeenCalledTimes(2);
  });
});

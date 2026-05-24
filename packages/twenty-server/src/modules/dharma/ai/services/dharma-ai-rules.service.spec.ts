import { Test, type TestingModule } from '@nestjs/testing';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';
import {
  SCORE_CRITICAL,
  SCORE_HIGH,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

import { DharmaAiRulesService } from './dharma-ai-rules.service';

const WORKSPACE_ID = 'ws_rules';

const buildOrmManager = (recordsByEntity: Record<string, unknown[]>) => ({
  getRepository: jest.fn().mockImplementation(async (_ws, entityName) => ({
    find: jest.fn().mockResolvedValue(recordsByEntity[entityName] ?? []),
  })),
});

const buildKpi = (overrides: Partial<{ blAvailable: number }> = {}) => ({
  computeKpi: jest.fn().mockResolvedValue({
    period: '2026-05',
    grossIncome: 0,
    blAvailable: 0,
    taxCassetto: 0,
    personaleCassetto: 0,
    ...overrides,
  }),
});

describe('DharmaAiRulesService', () => {
  const setup = async ({
    records,
    kpi,
  }: {
    records: Record<string, unknown[]>;
    kpi: ReturnType<typeof buildKpi>;
  }) => {
    const ormManager = buildOrmManager(records);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DharmaAiRulesService,
        { provide: GlobalWorkspaceOrmManager, useValue: ormManager },
        { provide: DharmaFinanceKpiService, useValue: kpi },
      ],
    }).compile();

    return module.get(DharmaAiRulesService);
  };

  it('should flag overdue active projects with HIGH score', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const service = await setup({
      records: {
        dharmaProject: [
          {
            id: 'p1',
            name: 'Site X',
            status: 'ACTIVE',
            endDate: yesterday,
          },
          // Completed should be ignored even if past
          {
            id: 'p2',
            name: 'Done Y',
            status: 'COMPLETED',
            endDate: yesterday,
          },
        ],
      },
      kpi: buildKpi(),
    });

    const signals = await service.evaluate({ workspaceId: WORKSPACE_ID });

    const overdue = signals.filter((signal) => signal.kind === 'TASK_PRIORITY');

    expect(overdue).toHaveLength(1);
    expect(overdue[0].score).toBe(SCORE_HIGH);
    expect(overdue[0].payload).toMatchObject({ projectId: 'p1' });
  });

  it('should flag CRITICAL when pending payouts exceed BL cassetto', async () => {
    const service = await setup({
      records: {
        dharmaCollaboratorPayout: [
          {
            id: 'pay1',
            status: 'PENDING',
            feeAmount: { amountMicros: 500_000_000 }, // €500
          },
        ],
      },
      kpi: buildKpi({ blAvailable: 100 }),
    });

    const signals = await service.evaluate({ workspaceId: WORKSPACE_ID });
    const payment = signals.find(
      (signal) =>
        signal.kind === 'PAYMENT' && signal.score === SCORE_CRITICAL,
    );

    expect(payment).toBeDefined();
    expect(payment?.payload).toMatchObject({ insufficientBl: true });
  });

  it('should flag CRITICAL when BL cassetto is negative', async () => {
    const service = await setup({
      records: {},
      kpi: buildKpi({ blAvailable: -250 }),
    });

    const signals = await service.evaluate({ workspaceId: WORKSPACE_ID });
    const exhaustion = signals.find((signal) =>
      signal.title.includes('BL cassetto is negative'),
    );

    expect(exhaustion?.score).toBe(SCORE_CRITICAL);
  });

  it('should return no signals when workspace is clean', async () => {
    const service = await setup({
      records: {},
      kpi: buildKpi({ blAvailable: 1000 }),
    });

    const signals = await service.evaluate({ workspaceId: WORKSPACE_ID });

    // Revenue alert depends on current day-of-month, so we only assert no
    // overdue/payment signals are produced — revenue alert may or may not fire
    expect(
      signals.filter(
        (signal) =>
          signal.kind === 'TASK_PRIORITY' || signal.kind === 'PAYMENT',
      ),
    ).toEqual([]);
  });
});

import { Injectable, Logger } from '@nestjs/common';

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaAiContextService } from 'src/modules/dharma/ai/services/dharma-ai-context.service';
import { DharmaAiRulesService } from 'src/modules/dharma/ai/services/dharma-ai-rules.service';
import {
  DEFAULT_AI_MODEL,
  DharmaAiContext,
  DharmaAiSignal,
  DharmaAiSuggestionRecord,
  REASONING_AI_MODEL,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

type RunOptions = {
  workspaceId: string;
  // Use reasoning model (Sonnet) instead of default (Haiku)
  useReasoningModel?: boolean;
  // Skip LLM step, only persist deterministic signals from rules
  rulesOnly?: boolean;
};

type RunResult = {
  rulesSignalsCount: number;
  llmSignalsCount: number;
  persistedSuggestionIds: string[];
  modelUsed: string;
};

const LLM_SUGGESTION_SCHEMA = z.object({
  suggestions: z
    .array(
      z.object({
        kind: z.enum([
          'TASK_PRIORITY',
          'FOLLOWUP',
          'PAYMENT',
          'REVENUE_ALERT',
          'INSIGHT',
        ]),
        title: z.string().min(3).max(120),
        body: z.string().min(10).max(800),
        score: z.number().min(0).max(1),
        rationale: z.string().min(5).max(400),
      }),
    )
    .max(8),
});

@Injectable()
export class DharmaAiOrchestratorService {
  private readonly logger = new Logger(DharmaAiOrchestratorService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly rulesService: DharmaAiRulesService,
    private readonly contextService: DharmaAiContextService,
  ) {}

  async run(options: RunOptions): Promise<RunResult> {
    const { workspaceId, useReasoningModel = false, rulesOnly = false } = options;

    const [rulesSignals, context] = await Promise.all([
      this.rulesService.evaluate({ workspaceId }),
      this.contextService.snapshot({ workspaceId, bypassCache: true }),
    ]);

    const modelId = useReasoningModel ? REASONING_AI_MODEL : DEFAULT_AI_MODEL;

    const llmSignals = rulesOnly
      ? []
      : await this.generateLlmSignals({ context, rulesSignals, modelId });

    const allSignals = [...rulesSignals, ...llmSignals];

    const persistedSuggestionIds = await this.persistSuggestions({
      workspaceId,
      signals: allSignals,
      modelUsed: rulesOnly ? 'rules-only' : modelId,
    });

    this.logger.log(
      `AI orchestrator run: workspace=${workspaceId} rules=${rulesSignals.length} llm=${llmSignals.length} persisted=${persistedSuggestionIds.length}`,
    );

    return {
      rulesSignalsCount: rulesSignals.length,
      llmSignalsCount: llmSignals.length,
      persistedSuggestionIds,
      modelUsed: rulesOnly ? 'rules-only' : modelId,
    };
  }

  private async generateLlmSignals({
    context,
    rulesSignals,
    modelId,
  }: {
    context: DharmaAiContext;
    rulesSignals: DharmaAiSignal[];
    modelId: string;
  }): Promise<DharmaAiSignal[]> {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — skipping LLM signal generation',
      );

      return [];
    }

    const prompt = this.buildPrompt({ context, rulesSignals });

    try {
      const { object } = await generateObject({
        model: anthropic(modelId),
        schema: LLM_SUGGESTION_SCHEMA,
        prompt,
      });

      return object.suggestions.map((suggestion) => ({
        kind: suggestion.kind,
        title: suggestion.title,
        body: `${suggestion.body}\n\nRationale: ${suggestion.rationale}`,
        payload: { rationale: suggestion.rationale, generatedBy: modelId },
        score: suggestion.score,
        source: 'LLM' as const,
      }));
    } catch (error) {
      this.logger.error(
        `LLM generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return [];
    }
  }

  private buildPrompt({
    context,
    rulesSignals,
  }: {
    context: DharmaAiContext;
    rulesSignals: DharmaAiSignal[];
  }): string {
    const memoriesSection =
      context.recentMemories.length === 0
        ? 'No memories yet.'
        : context.recentMemories
            .slice(0, 10)
            .map(
              (memory) =>
                `- [${memory.kind ?? 'UNKNOWN'}] ${memory.content ?? ''}`,
            )
            .join('\n');

    const rulesSection =
      rulesSignals.length === 0
        ? 'No deterministic signals from rules engine.'
        : rulesSignals
            .map(
              (signal) =>
                `- [${signal.kind}] ${signal.title} (score ${signal.score})`,
            )
            .join('\n');

    return [
      'You are the Dharma AI assistant for a solo creative-studio CRM.',
      'Generate up to 5 high-value suggestions that complement (do not duplicate) the deterministic signals already produced by the rules engine.',
      'Focus on patterns the rules engine cannot see: pipeline gaps, cross-entity insights, cassetto health, prioritization across noisy signals.',
      '',
      '## Workspace context',
      `Period: ${context.finance.period}`,
      `Gross income: € ${context.finance.grossIncome.toFixed(2)}`,
      `BL cassetto available: € ${context.finance.blAvailable.toFixed(2)}`,
      `Tax cassetto: € ${context.finance.taxCassetto.toFixed(2)}`,
      `Pending payouts: € ${context.finance.pendingPayouts.toFixed(2)}`,
      `Active projects: ${context.projects.activeCount} (blocked ${context.projects.blockedCount}, overdue ${context.projects.overdueCount})`,
      `Active clients: ${context.contacts.totalActive} (stale follow-ups ${context.contacts.staleFollowUpCount})`,
      '',
      '## User memories (preferences, rules, patterns)',
      memoriesSection,
      '',
      '## Existing deterministic signals',
      rulesSection,
      '',
      'Return suggestions only. Each suggestion must include a short rationale grounded in the context above.',
    ].join('\n');
  }

  private async persistSuggestions({
    workspaceId,
    signals,
    modelUsed,
  }: {
    workspaceId: string;
    signals: DharmaAiSignal[];
    modelUsed: string;
  }): Promise<string[]> {
    if (signals.length === 0) {
      return [];
    }

    const repo = await this.twentyORMGlobalManager.getRepository<DharmaAiSuggestionRecord>(
      workspaceId,
      'dharmaAiSuggestion',
      { shouldBypassPermissionChecks: true },
    );

    const now = new Date();

    const persisted = await repo.save(
      signals.map((signal) => ({
        kind: signal.kind,
        title: signal.title,
        body: signal.body,
        payload: signal.payload,
        score: signal.score,
        source: signal.source,
        modelUsed,
        status: 'PENDING' as const,
        generatedAt: now,
      })),
    );

    const list = Array.isArray(persisted) ? persisted : [persisted];

    return list
      .map((record) => (record as DharmaAiSuggestionRecord).id)
      .filter((id): id is string => typeof id === 'string');
  }
}

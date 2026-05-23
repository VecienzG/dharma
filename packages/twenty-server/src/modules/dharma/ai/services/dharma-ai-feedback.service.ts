import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';
import {
  DharmaAiSuggestionRecord,
  DharmaAiSuggestionStatus,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

type ResolveFeedbackInput = {
  workspaceId: string;
  suggestionId: string;
  status: Exclude<DharmaAiSuggestionStatus, 'PENDING'>;
  // Optional user-provided reason — if status=ACCEPTED, this is also used as memory content
  comment?: string;
};

type ResolveFeedbackResult = {
  suggestionId: string;
  status: DharmaAiSuggestionStatus;
  memoryCreatedId: string | null;
};

@Injectable()
export class DharmaAiFeedbackService {
  private readonly logger = new Logger(DharmaAiFeedbackService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
    private readonly memoryService: DharmaAiMemoryService,
  ) {}

  async resolve(input: ResolveFeedbackInput): Promise<ResolveFeedbackResult> {
    const { workspaceId, suggestionId, status, comment } = input;

    const repo = await this.twentyORMGlobalManager.getRepository<DharmaAiSuggestionRecord>(
      workspaceId,
      'dharmaAiSuggestion',
      { shouldBypassPermissionChecks: true },
    );

    const suggestion = await repo.findOne({ where: { id: suggestionId } });

    if (!suggestion) {
      throw new NotFoundException(
        `Suggestion ${suggestionId} not found in workspace ${workspaceId}`,
      );
    }

    await repo.update(
      { id: suggestionId },
      {
        status,
        resolvedAt: new Date(),
      },
    );

    let memoryCreatedId: string | null = null;

    if (status === 'ACCEPTED' || status === 'REJECTED') {
      const memory = await this.recordFeedbackAsMemory({
        workspaceId,
        suggestion,
        status,
        comment,
      });

      memoryCreatedId = memory.id;
    }

    this.logger.log(
      `Feedback resolved: suggestion=${suggestionId} status=${status} memory=${memoryCreatedId ?? 'none'}`,
    );

    return { suggestionId, status, memoryCreatedId };
  }

  private async recordFeedbackAsMemory({
    workspaceId,
    suggestion,
    status,
    comment,
  }: {
    workspaceId: string;
    suggestion: DharmaAiSuggestionRecord;
    status: Exclude<DharmaAiSuggestionStatus, 'PENDING'>;
    comment?: string;
  }): Promise<{ id: string }> {
    // ACCEPTED feedback becomes a PATTERN memory — user endorsed this kind of suggestion
    // REJECTED feedback becomes a RULE memory — explicit "don't suggest this again"
    const kind = status === 'ACCEPTED' ? 'PATTERN' : 'RULE';

    const baseContent = status === 'ACCEPTED'
      ? `User accepted "${suggestion.kind}" suggestion: ${suggestion.title}.`
      : `User rejected "${suggestion.kind}" suggestion: ${suggestion.title}. Do not surface again unless context clearly differs.`;

    const content = comment
      ? `${baseContent} User note: ${comment}`
      : baseContent;

    const tags = [
      suggestion.kind?.toLowerCase() ?? 'unknown',
      status.toLowerCase(),
    ].filter(Boolean);

    return this.memoryService.createMemory({
      workspaceId,
      kind,
      content,
      tags,
      source: 'USER_FEEDBACK',
      score: status === 'ACCEPTED' ? 0.8 : 0.6,
    });
  }
}

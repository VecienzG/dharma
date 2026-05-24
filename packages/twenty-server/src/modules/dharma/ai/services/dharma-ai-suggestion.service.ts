import { Injectable } from '@nestjs/common';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DharmaAiSuggestionRecord,
  DharmaAiSuggestionStatus,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

const DEFAULT_LIST_LIMIT = 50;

@Injectable()
export class DharmaAiSuggestionService {
  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  async list({
    workspaceId,
    status,
    limit = DEFAULT_LIST_LIMIT,
  }: {
    workspaceId: string;
    status?: DharmaAiSuggestionStatus;
    limit?: number;
  }): Promise<DharmaAiSuggestionRecord[]> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaAiSuggestionRecord>(
        workspaceId,
        'dharmaAiSuggestion',
        { shouldBypassPermissionChecks: true },
      );

    return repo.find({
      where: status ? { status } : undefined,
      order: { generatedAt: 'DESC' },
      take: limit,
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyArray } from 'twenty-shared/utils';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DharmaAiMemoryKind,
  DharmaAiMemoryRecord,
  DharmaAiMemorySource,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

type CreateMemoryInput = {
  workspaceId: string;
  kind: DharmaAiMemoryKind;
  content: string;
  tags?: string[];
  source?: DharmaAiMemorySource;
  score?: number;
};

type FindByTagsInput = {
  workspaceId: string;
  tags: string[];
  limit?: number;
};

const DEFAULT_MEMORY_SCORE = 0.5;

@Injectable()
export class DharmaAiMemoryService {
  private readonly logger = new Logger(DharmaAiMemoryService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  async createMemory(input: CreateMemoryInput): Promise<DharmaAiMemoryRecord> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaAiMemoryRecord>(
      input.workspaceId,
      'dharmaAiMemory',
      { shouldBypassPermissionChecks: true },
    );

    const now = new Date();

    const saved = await repo.save({
      kind: input.kind,
      content: input.content,
      tags: input.tags ?? [],
      score: input.score ?? DEFAULT_MEMORY_SCORE,
      source: input.source ?? 'INFERRED',
      lastUsedAt: now,
    });

    const persisted = Array.isArray(saved) ? saved[0] : saved;

    this.logger.log(
      `Memory created: kind=${input.kind} workspace=${input.workspaceId}`,
    );

    return persisted as DharmaAiMemoryRecord;
  }

  async findRecent({
    workspaceId,
    limit = 20,
  }: {
    workspaceId: string;
    limit?: number;
  }): Promise<DharmaAiMemoryRecord[]> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaAiMemoryRecord>(
      workspaceId,
      'dharmaAiMemory',
      { shouldBypassPermissionChecks: true },
    );

    const memories = await repo.find({
      order: { lastUsedAt: 'DESC' },
      take: limit,
    });

    return memories;
  }

  async findByTags({
    workspaceId,
    tags,
    limit = 10,
  }: FindByTagsInput): Promise<DharmaAiMemoryRecord[]> {
    if (tags.length === 0) {
      return [];
    }

    const memories = await this.findRecent({ workspaceId, limit: 200 });

    const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));

    return memories
      .filter((memory) => {
        if (!isNonEmptyArray(memory.tags)) {
          return false;
        }

        return memory.tags.some((tag) => tagSet.has(tag.toLowerCase()));
      })
      .slice(0, limit);
  }

  async touchUsage({
    workspaceId,
    memoryId,
  }: {
    workspaceId: string;
    memoryId: string;
  }): Promise<void> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaAiMemoryRecord>(
      workspaceId,
      'dharmaAiMemory',
      { shouldBypassPermissionChecks: true },
    );

    await repo.update({ id: memoryId }, { lastUsedAt: new Date() });
  }
}

import { Injectable, Logger } from '@nestjs/common';

import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  DharmaNotificationChannel,
  DharmaNotificationKind,
  DharmaNotificationPreferenceRecord,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

type ResolveInput = {
  workspaceId: string;
  kind: DharmaNotificationKind;
  tags: string[];
  score?: number;
  workspaceMemberId?: string;
  // If set, only matches preferences for this explicit channel
  channel?: DharmaNotificationChannel;
};

export type UpsertPreferenceInput = {
  workspaceId: string;
  workspaceMemberId: string;
  channel: DharmaNotificationChannel;
  enabled?: boolean;
  kinds?: DharmaNotificationKind[];
  mutedTags?: string[];
  minScore?: number;
  endpoint?: string | null;
  config?: Record<string, unknown> | null;
};

@Injectable()
export class DharmaNotificationPreferencesService {
  private readonly logger = new Logger(
    DharmaNotificationPreferencesService.name,
  );

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  async resolveDestinations(
    input: ResolveInput,
  ): Promise<DharmaNotificationPreferenceRecord[]> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaNotificationPreferenceRecord>(
        input.workspaceId,
        'dharmaNotificationPreference',
        { shouldBypassPermissionChecks: true },
      );

    const all = await repo.find({});

    return all.filter((pref) => this.matches(pref, input));
  }

  async listForMember({
    workspaceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
  }): Promise<DharmaNotificationPreferenceRecord[]> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaNotificationPreferenceRecord>(
        workspaceId,
        'dharmaNotificationPreference',
        { shouldBypassPermissionChecks: true },
      );

    return repo.find({ where: { workspaceMemberId } });
  }

  // Upserts a single (workspaceMember, channel) preference row.
  async upsert(
    input: UpsertPreferenceInput,
  ): Promise<DharmaNotificationPreferenceRecord> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaNotificationPreferenceRecord>(
        input.workspaceId,
        'dharmaNotificationPreference',
        { shouldBypassPermissionChecks: true },
      );

    const existing = await repo.findOne({
      where: {
        workspaceMemberId: input.workspaceMemberId,
        channel: input.channel,
      },
    });

    const payload = {
      workspaceMemberId: input.workspaceMemberId,
      channel: input.channel,
      enabled: input.enabled ?? existing?.enabled ?? true,
      kinds: input.kinds ?? existing?.kinds ?? [],
      mutedTags: input.mutedTags ?? existing?.mutedTags ?? [],
      minScore: input.minScore ?? existing?.minScore ?? 0,
      endpoint:
        input.endpoint !== undefined
          ? input.endpoint
          : (existing?.endpoint ?? null),
      config:
        input.config !== undefined ? input.config : (existing?.config ?? null),
    };

    const saved = existing
      ? await repo.save({ ...existing, ...payload })
      : await repo.save(payload);

    const persisted = Array.isArray(saved) ? saved[0] : saved;

    return persisted as DharmaNotificationPreferenceRecord;
  }

  async delete({
    workspaceId,
    preferenceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    preferenceId: string;
    workspaceMemberId: string;
  }): Promise<boolean> {
    const repo =
      await this.twentyORMGlobalManager.getRepository<DharmaNotificationPreferenceRecord>(
        workspaceId,
        'dharmaNotificationPreference',
        { shouldBypassPermissionChecks: true },
      );

    const existing = await repo.findOne({
      where: { id: preferenceId, workspaceMemberId },
    });

    if (!existing) return false;

    await repo.delete({ id: preferenceId });

    return true;
  }

  private matches(
    pref: DharmaNotificationPreferenceRecord,
    input: ResolveInput,
  ): boolean {
    if (pref.enabled === false) {
      return false;
    }

    if (isDefined(input.channel) && pref.channel !== input.channel) {
      return false;
    }

    if (
      isDefined(input.workspaceMemberId) &&
      isDefined(pref.workspaceMemberId) &&
      pref.workspaceMemberId !== input.workspaceMemberId
    ) {
      return false;
    }

    if (isNonEmptyArray(pref.kinds) && !pref.kinds.includes(input.kind)) {
      return false;
    }

    if (
      isNonEmptyArray(pref.mutedTags) &&
      input.tags.some((tag) => pref.mutedTags?.includes(tag))
    ) {
      return false;
    }

    if (
      isDefined(pref.minScore) &&
      isDefined(input.score) &&
      input.score < pref.minScore
    ) {
      return false;
    }

    if (!pref.endpoint && pref.channel !== 'WEB_PUSH') {
      // WEB_PUSH stores subscription in config; other channels need endpoint
      return false;
    }

    return true;
  }
}

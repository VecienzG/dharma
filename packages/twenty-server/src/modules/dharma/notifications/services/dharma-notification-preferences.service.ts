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

@Injectable()
export class DharmaNotificationPreferencesService {
  private readonly logger = new Logger(DharmaNotificationPreferencesService.name);

  constructor(
    private readonly twentyORMGlobalManager: GlobalWorkspaceOrmManager,
  ) {}

  async resolveDestinations(
    input: ResolveInput,
  ): Promise<DharmaNotificationPreferenceRecord[]> {
    const repo = await this.twentyORMGlobalManager.getRepository<DharmaNotificationPreferenceRecord>(
      input.workspaceId,
      'dharmaNotificationPreference',
      { shouldBypassPermissionChecks: true },
    );

    const all = await repo.find({});

    return all.filter((pref) => this.matches(pref, input));
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

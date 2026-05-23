import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { DharmaNotificationsDispatcherService } from 'src/modules/dharma/notifications/services/dharma-notifications-dispatcher.service';
import { DharmaNotificationsService } from 'src/modules/dharma/notifications/services/dharma-notifications.service';
import {
  DharmaNotificationChannel,
  DharmaNotificationKind,
} from 'src/modules/dharma/notifications/types/dharma-notification.types';

type CommandOptions = {
  workspaceId: string;
  channel?: DharmaNotificationChannel;
  kind?: DharmaNotificationKind;
  title?: string;
  body?: string;
};

const ALLOWED_CHANNELS: DharmaNotificationChannel[] = [
  'EMAIL',
  'WEB_PUSH',
  'TELEGRAM',
];

const ALLOWED_KINDS: DharmaNotificationKind[] = [
  'AI_SUGGESTION',
  'TASK_DUE',
  'PAYMENT',
  'FOLLOWUP',
  'SYSTEM',
  'TEST',
];

@Command({
  name: 'dharma:notifications:send',
  description:
    'Send a test notification through configured drivers. Resolves recipients via existing notification preferences.',
})
export class DharmaNotificationsSendCommand extends CommandRunner {
  private readonly logger = new Logger(DharmaNotificationsSendCommand.name);

  constructor(
    private readonly notificationsService: DharmaNotificationsService,
    private readonly dispatcher: DharmaNotificationsDispatcherService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Target workspace ID',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '-c, --channel <channel>',
    description: `Force a specific channel (${ALLOWED_CHANNELS.join('|')})`,
  })
  parseChannel(value: string): DharmaNotificationChannel {
    const upper = value.toUpperCase() as DharmaNotificationChannel;

    if (!ALLOWED_CHANNELS.includes(upper)) {
      throw new Error(
        `Invalid channel "${value}". Allowed: ${ALLOWED_CHANNELS.join(', ')}`,
      );
    }

    return upper;
  }

  @Option({
    flags: '-k, --kind <kind>',
    description: `Notification kind (default: TEST)`,
  })
  parseKind(value: string): DharmaNotificationKind {
    const upper = value.toUpperCase() as DharmaNotificationKind;

    if (!ALLOWED_KINDS.includes(upper)) {
      throw new Error(
        `Invalid kind "${value}". Allowed: ${ALLOWED_KINDS.join(', ')}`,
      );
    }

    return upper;
  }

  @Option({
    flags: '-t, --title <title>',
    description: 'Notification title',
  })
  parseTitle(value: string): string {
    return value;
  }

  @Option({
    flags: '-b, --body <body>',
    description: 'Notification body',
  })
  parseBody(value: string): string {
    return value;
  }

  async run(_passedParams: string[], options: CommandOptions): Promise<void> {
    try {
      const authContext = buildSystemAuthContext(options.workspaceId);

      const configured = this.dispatcher.getConfiguredChannels();

      this.logger.log(
        `Configured channels: ${configured.length > 0 ? configured.join(', ') : '(none — set env vars)'}`,
      );

      const result = await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        () =>
          this.notificationsService.send({
            workspaceId: options.workspaceId,
            request: {
              kind: options.kind ?? 'TEST',
              title: options.title ?? 'Dharma test notification',
              body:
                options.body ??
                'If you can see this, your notification pipeline is wired up.',
              tags: ['test'],
              sourceKind: 'MANUAL',
              channel: options.channel,
              score: 1,
            },
          }),
        authContext,
      );

      this.logger.log('──────────────────────────────────────────');
      this.logger.log('  Notification send result');
      this.logger.log('──────────────────────────────────────────');
      this.logger.log(`  Attempted        : ${result.attempted}`);
      this.logger.log(`  Sent             : ${result.sent}`);
      this.logger.log(`  Failed           : ${result.failed}`);
      this.logger.log(`  Skipped          : ${result.skipped}`);
      this.logger.log(`  Notification IDs : ${result.notificationIds.length}`);
      this.logger.log('──────────────────────────────────────────');
    } catch (error) {
      this.logger.error('Notification send failed:', error);

      if (error instanceof Error && error.stack) {
        this.logger.error(error.stack);
      }

      process.exit(1);
    }
  }
}

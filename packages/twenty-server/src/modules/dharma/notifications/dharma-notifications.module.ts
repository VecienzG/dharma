import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { DharmaNotificationSchedulerCronCommand } from 'src/modules/dharma/notifications/commands/dharma-notification-scheduler.cron.command';
import { DharmaNotificationsController } from 'src/modules/dharma/notifications/controllers/dharma-notifications.controller';
import { DharmaNotificationSchedulerCronJob } from 'src/modules/dharma/notifications/crons/dharma-notification-scheduler.cron.job';
import { ResendEmailDriver } from 'src/modules/dharma/notifications/drivers/resend-email.driver';
import { TelegramDriver } from 'src/modules/dharma/notifications/drivers/telegram.driver';
import { WebPushDriver } from 'src/modules/dharma/notifications/drivers/web-push.driver';
import { DharmaNotificationSchedulerJob } from 'src/modules/dharma/notifications/jobs/dharma-notification-scheduler.job';
import { DharmaNotificationPreferencesService } from 'src/modules/dharma/notifications/services/dharma-notification-preferences.service';
import { DharmaNotificationSchedulerService } from 'src/modules/dharma/notifications/services/dharma-notification-scheduler.service';
import { DharmaNotificationsDispatcherService } from 'src/modules/dharma/notifications/services/dharma-notifications-dispatcher.service';
import { DharmaNotificationsService } from 'src/modules/dharma/notifications/services/dharma-notifications.service';

@Module({
  imports: [
    GlobalWorkspaceDataSourceModule,
    AuthModule,
    WorkspaceCacheStorageModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  controllers: [DharmaNotificationsController],
  providers: [
    ResendEmailDriver,
    WebPushDriver,
    TelegramDriver,
    DharmaNotificationsDispatcherService,
    DharmaNotificationPreferencesService,
    DharmaNotificationsService,
    DharmaNotificationSchedulerService,
    DharmaNotificationSchedulerJob,
    DharmaNotificationSchedulerCronJob,
    DharmaNotificationSchedulerCronCommand,
  ],
  exports: [
    DharmaNotificationsService,
    DharmaNotificationsDispatcherService,
    DharmaNotificationPreferencesService,
    DharmaNotificationSchedulerService,
    DharmaNotificationSchedulerCronCommand,
  ],
})
export class DharmaNotificationsModule {}

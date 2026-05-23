import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { ResendEmailDriver } from 'src/modules/dharma/notifications/drivers/resend-email.driver';
import { TelegramDriver } from 'src/modules/dharma/notifications/drivers/telegram.driver';
import { WebPushDriver } from 'src/modules/dharma/notifications/drivers/web-push.driver';
import { DharmaNotificationPreferencesService } from 'src/modules/dharma/notifications/services/dharma-notification-preferences.service';
import { DharmaNotificationsDispatcherService } from 'src/modules/dharma/notifications/services/dharma-notifications-dispatcher.service';
import { DharmaNotificationsService } from 'src/modules/dharma/notifications/services/dharma-notifications.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule],
  providers: [
    ResendEmailDriver,
    WebPushDriver,
    TelegramDriver,
    DharmaNotificationsDispatcherService,
    DharmaNotificationPreferencesService,
    DharmaNotificationsService,
  ],
  exports: [
    DharmaNotificationsService,
    DharmaNotificationsDispatcherService,
    DharmaNotificationPreferencesService,
  ],
})
export class DharmaNotificationsModule {}

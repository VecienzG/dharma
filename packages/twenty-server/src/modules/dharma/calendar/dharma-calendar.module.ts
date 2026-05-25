import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { DharmaCalendarController } from 'src/modules/dharma/calendar/controllers/dharma-calendar.controller';
import { DharmaGoogleCalendarSyncService } from 'src/modules/dharma/calendar/services/dharma-google-calendar-sync.service';
import { DharmaGoogleOauthService } from 'src/modules/dharma/calendar/services/dharma-google-oauth.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule, AuthModule, WorkspaceCacheStorageModule],
  controllers: [DharmaCalendarController],
  providers: [DharmaGoogleOauthService, DharmaGoogleCalendarSyncService],
  exports: [DharmaGoogleOauthService, DharmaGoogleCalendarSyncService],
})
export class DharmaCalendarModule {}

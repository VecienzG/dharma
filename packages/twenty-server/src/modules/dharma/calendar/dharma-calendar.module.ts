import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { DharmaCalendarController } from 'src/modules/dharma/calendar/controllers/dharma-calendar.controller';
import { DharmaGoogleCalendarSyncService } from 'src/modules/dharma/calendar/services/dharma-google-calendar-sync.service';
import { DharmaGoogleOauthService } from 'src/modules/dharma/calendar/services/dharma-google-oauth.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule],
  controllers: [DharmaCalendarController],
  providers: [DharmaGoogleOauthService, DharmaGoogleCalendarSyncService],
  exports: [DharmaGoogleOauthService, DharmaGoogleCalendarSyncService],
})
export class DharmaCalendarModule {}

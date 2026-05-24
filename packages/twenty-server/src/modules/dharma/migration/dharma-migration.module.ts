import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { DharmaFinanceModule } from 'src/modules/dharma/finance/dharma-finance.module';
import { DharmaBielleCrmSourceService } from 'src/modules/dharma/migration/services/dharma-biellecrm-source.service';
import { DharmaMigrationMapperService } from 'src/modules/dharma/migration/services/dharma-migration-mapper.service';
import { DharmaMigrationService } from 'src/modules/dharma/migration/services/dharma-migration.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule, DharmaFinanceModule],
  providers: [
    DharmaBielleCrmSourceService,
    DharmaMigrationMapperService,
    DharmaMigrationService,
  ],
  exports: [DharmaMigrationService, DharmaMigrationMapperService],
})
export class DharmaMigrationModule {}

import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { DharmaFinanceKpiService } from 'src/modules/dharma/finance/services/dharma-finance-kpi.service';
import { DharmaSplitEngineService } from 'src/modules/dharma/finance/services/dharma-split-engine.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule],
  providers: [DharmaSplitEngineService, DharmaFinanceKpiService],
  exports: [DharmaSplitEngineService, DharmaFinanceKpiService],
})
export class DharmaFinanceModule {}

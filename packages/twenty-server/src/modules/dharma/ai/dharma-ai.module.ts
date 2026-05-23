import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { DharmaFinanceModule } from 'src/modules/dharma/finance/dharma-finance.module';
import { DharmaAiContextService } from 'src/modules/dharma/ai/services/dharma-ai-context.service';
import { DharmaAiFeedbackService } from 'src/modules/dharma/ai/services/dharma-ai-feedback.service';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';
import { DharmaAiOrchestratorService } from 'src/modules/dharma/ai/services/dharma-ai-orchestrator.service';
import { DharmaAiRulesService } from 'src/modules/dharma/ai/services/dharma-ai-rules.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule, DharmaFinanceModule],
  providers: [
    DharmaAiMemoryService,
    DharmaAiRulesService,
    DharmaAiContextService,
    DharmaAiOrchestratorService,
    DharmaAiFeedbackService,
  ],
  exports: [
    DharmaAiMemoryService,
    DharmaAiRulesService,
    DharmaAiContextService,
    DharmaAiOrchestratorService,
    DharmaAiFeedbackService,
  ],
})
export class DharmaAiModule {}

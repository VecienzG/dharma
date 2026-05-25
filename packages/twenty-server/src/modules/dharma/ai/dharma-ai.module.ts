import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { DharmaFinanceModule } from 'src/modules/dharma/finance/dharma-finance.module';
import { DharmaNotificationsModule } from 'src/modules/dharma/notifications/dharma-notifications.module';
import { DharmaAiOrchestratorCronCommand } from 'src/modules/dharma/ai/commands/dharma-ai-orchestrator.cron.command';
import { DharmaAiSuggestionsController } from 'src/modules/dharma/ai/controllers/dharma-ai-suggestions.controller';
import { DharmaAiOrchestratorCronJob } from 'src/modules/dharma/ai/crons/dharma-ai-orchestrator.cron.job';
import { DharmaAiOrchestratorJob } from 'src/modules/dharma/ai/jobs/dharma-ai-orchestrator.job';
import { DharmaAiContextService } from 'src/modules/dharma/ai/services/dharma-ai-context.service';
import { DharmaAiFeedbackService } from 'src/modules/dharma/ai/services/dharma-ai-feedback.service';
import { DharmaAiMemoryService } from 'src/modules/dharma/ai/services/dharma-ai-memory.service';
import { DharmaAiOrchestratorService } from 'src/modules/dharma/ai/services/dharma-ai-orchestrator.service';
import { DharmaAiRulesService } from 'src/modules/dharma/ai/services/dharma-ai-rules.service';
import { DharmaAiSuggestionService } from 'src/modules/dharma/ai/services/dharma-ai-suggestion.service';

@Module({
  imports: [
    GlobalWorkspaceDataSourceModule,
    DharmaFinanceModule,
    DharmaNotificationsModule,
    AuthModule,
    WorkspaceCacheStorageModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  controllers: [DharmaAiSuggestionsController],
  providers: [
    DharmaAiMemoryService,
    DharmaAiRulesService,
    DharmaAiContextService,
    DharmaAiOrchestratorService,
    DharmaAiFeedbackService,
    DharmaAiSuggestionService,
    DharmaAiOrchestratorJob,
    DharmaAiOrchestratorCronJob,
    DharmaAiOrchestratorCronCommand,
  ],
  exports: [
    DharmaAiMemoryService,
    DharmaAiRulesService,
    DharmaAiContextService,
    DharmaAiOrchestratorService,
    DharmaAiFeedbackService,
    DharmaAiSuggestionService,
    DharmaAiOrchestratorCronCommand,
  ],
})
export class DharmaAiModule {}

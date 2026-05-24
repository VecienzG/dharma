import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { DharmaAiFeedbackService } from 'src/modules/dharma/ai/services/dharma-ai-feedback.service';
import { DharmaAiSuggestionService } from 'src/modules/dharma/ai/services/dharma-ai-suggestion.service';
import {
  type DharmaAiSuggestionRecord,
  type DharmaAiSuggestionStatus,
} from 'src/modules/dharma/ai/types/dharma-ai.types';

type ResolveBody = {
  comment?: string;
};

@Controller('rest/dharma/ai/suggestions')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@UseFilters(RestApiExceptionFilter)
export class DharmaAiSuggestionsController {
  constructor(
    private readonly suggestionService: DharmaAiSuggestionService,
    private readonly feedbackService: DharmaAiFeedbackService,
  ) {}

  @Get()
  async list(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Query('status') status?: DharmaAiSuggestionStatus,
    @Query('limit') limit?: string,
  ): Promise<DharmaAiSuggestionRecord[]> {
    return this.suggestionService.list({
      workspaceId: workspace.id,
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(':id/accept')
  async accept(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
    @Body() body?: ResolveBody,
  ) {
    return this.feedbackService.resolve({
      workspaceId: workspace.id,
      suggestionId: id,
      status: 'ACCEPTED',
      comment: body?.comment,
    });
  }

  @Post(':id/reject')
  async reject(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
    @Body() body?: ResolveBody,
  ) {
    return this.feedbackService.resolve({
      workspaceId: workspace.id,
      suggestionId: id,
      status: 'REJECTED',
      comment: body?.comment,
    });
  }

  @Post(':id/dismiss')
  async dismiss(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
  ) {
    return this.feedbackService.resolve({
      workspaceId: workspace.id,
      suggestionId: id,
      status: 'DISMISSED',
    });
  }
}

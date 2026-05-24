import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { DharmaStorageService } from 'src/modules/dharma/storage/services/dharma-storage.service';
import {
  type DharmaStorageTier,
  type DharmaStorageUploadResult,
} from 'src/modules/dharma/storage/types/dharma-storage.types';

type UploadBody = {
  filename: string;
  base64Body: string;
  contentType?: string;
  pathPrefix?: string;
  forceTier?: DharmaStorageTier;
};

@Controller('rest/dharma/storage')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@UseFilters(RestApiExceptionFilter)
export class DharmaStorageController {
  constructor(private readonly storageService: DharmaStorageService) {}

  @Post('upload')
  async upload(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() body: UploadBody,
  ): Promise<DharmaStorageUploadResult> {
    if (!body?.filename || !body?.base64Body) {
      throw new BadRequestException(
        'filename and base64Body are required in the request body',
      );
    }

    const buffer = Buffer.from(body.base64Body, 'base64');

    if (buffer.length === 0) {
      throw new BadRequestException('Decoded body is empty');
    }

    return this.storageService.upload({
      workspaceId: workspace.id,
      forceTier: body.forceTier,
      request: {
        filename: body.filename,
        body: buffer,
        contentType: body.contentType,
        pathPrefix: body.pathPrefix,
      },
    });
  }
}

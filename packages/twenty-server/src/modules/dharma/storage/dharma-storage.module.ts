import { Module } from '@nestjs/common';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { DharmaStorageController } from 'src/modules/dharma/storage/controllers/dharma-storage.controller';
import { VercelBlobStorageDriver } from 'src/modules/dharma/storage/drivers/vercel-blob.driver';
import { WebDavNasStorageDriver } from 'src/modules/dharma/storage/drivers/webdav-nas.driver';
import { DharmaStorageService } from 'src/modules/dharma/storage/services/dharma-storage.service';

@Module({
  imports: [AuthModule, WorkspaceCacheStorageModule],
  controllers: [DharmaStorageController],
  providers: [
    VercelBlobStorageDriver,
    WebDavNasStorageDriver,
    DharmaStorageService,
  ],
  exports: [DharmaStorageService],
})
export class DharmaStorageModule {}

import { Module } from '@nestjs/common';

import { DharmaStorageController } from 'src/modules/dharma/storage/controllers/dharma-storage.controller';
import { VercelBlobStorageDriver } from 'src/modules/dharma/storage/drivers/vercel-blob.driver';
import { WebDavNasStorageDriver } from 'src/modules/dharma/storage/drivers/webdav-nas.driver';
import { DharmaStorageService } from 'src/modules/dharma/storage/services/dharma-storage.service';

@Module({
  controllers: [DharmaStorageController],
  providers: [
    VercelBlobStorageDriver,
    WebDavNasStorageDriver,
    DharmaStorageService,
  ],
  exports: [DharmaStorageService],
})
export class DharmaStorageModule {}

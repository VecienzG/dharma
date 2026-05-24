import { Module } from '@nestjs/common';

import { DharmaWorkspaceSeederService } from './dharma-workspace-seeder.service';

// Thin re-export module — dependencies resolved by DatabaseCommandModule
@Module({
  providers: [DharmaWorkspaceSeederService],
  exports: [DharmaWorkspaceSeederService],
})
export class DharmaWorkspaceSeederModule {}

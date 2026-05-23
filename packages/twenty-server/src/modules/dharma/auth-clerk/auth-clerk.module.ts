import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { UserWorkspaceModule } from 'src/engine/core-modules/user-workspace/user-workspace.module';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

import { ClerkExchangeController } from './controllers/clerk-exchange.controller';
import { ClerkWebhookController } from './controllers/clerk-webhook.controller';
import { ClerkJwtService } from './services/clerk-jwt.service';
import { ClerkUserSyncService } from './services/clerk-user-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserWorkspaceEntity,
      WorkspaceEntity,
    ]),
    AuthModule,
    UserWorkspaceModule,
    TwentyConfigModule,
  ],
  controllers: [ClerkExchangeController, ClerkWebhookController],
  providers: [ClerkJwtService, ClerkUserSyncService],
})
export class AuthClerkModule {}

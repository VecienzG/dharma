import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { RefreshTokenService } from 'src/engine/core-modules/auth/token/services/refresh-token.service';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/auth-context.type';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

import { ClerkJwtService } from '../services/clerk-jwt.service';
import { ClerkUserSyncService } from '../services/clerk-user-sync.service';

@Controller('auth/clerk')
export class ClerkExchangeController {
  constructor(
    private readonly clerkJwtService: ClerkJwtService,
    private readonly clerkUserSyncService: ClerkUserSyncService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async exchange(
    @Headers('authorization') authorization?: string,
    @Body() body?: { workspaceId?: string },
  ) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Clerk bearer token');
    }

    const clerkToken = authorization.slice('Bearer '.length).trim();
    const claims = await this.clerkJwtService.verify(clerkToken);

    const { user, workspaceId } =
      await this.clerkUserSyncService.upsertFromClaims(
        claims,
        body?.workspaceId,
      );

    const accessToken = await this.accessTokenService.generateAccessToken({
      userId: user.id,
      workspaceId,
      authProvider: AuthProviderEnum.Clerk,
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken({
      userId: user.id,
      workspaceId,
      authProvider: AuthProviderEnum.Clerk,
      targetedTokenType: JwtTokenTypeEnum.ACCESS,
    });

    return {
      tokens: {
        accessOrWorkspaceAgnosticToken: accessToken,
        refreshToken,
      },
    };
  }
}

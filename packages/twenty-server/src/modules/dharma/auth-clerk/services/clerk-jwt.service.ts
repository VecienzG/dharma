import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

export interface ClerkClaims extends JWTPayload {
  sub: string;
  email?: string;
  primary_email_address?: string;
  first_name?: string | null;
  last_name?: string | null;
  workspace_id?: string;
}

@Injectable()
export class ClerkJwtService {
  private readonly logger = new Logger(ClerkJwtService.name);
  private jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly configService: TwentyConfigService) {}

  private getJwks() {
    if (this.jwksCache) return this.jwksCache;
    const jwksUrl = this.configService.get('CLERK_JWT_KEY');
    if (!jwksUrl) throw new Error('CLERK_JWT_KEY (JWKS URL) not configured');
    this.jwksCache = createRemoteJWKSet(new URL(jwksUrl), {
      cacheMaxAge: 10 * 60 * 1000,
    });
    return this.jwksCache;
  }

  async verify(token: string): Promise<ClerkClaims> {
    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: this.configService.get('CLERK_JWT_ISSUER') ?? undefined,
      });
      return payload as ClerkClaims;
    } catch (e) {
      this.logger.warn(
        `Clerk JWT verification failed: ${(e as Error).message}`,
      );
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}

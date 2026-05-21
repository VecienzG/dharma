import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

import { ClerkJwtService } from './clerk-jwt.service';

const mockJwtVerify = jest.fn();
const mockCreateRemoteJWKSet = jest.fn();

jest.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
  createRemoteJWKSet: (...args: unknown[]) =>
    mockCreateRemoteJWKSet(...args),
}));

describe('ClerkJwtService', () => {
  let service: ClerkJwtService;
  let configService: jest.Mocked<TwentyConfigService>;

  const FAKE_JWKS_FN = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCreateRemoteJWKSet.mockReturnValue(FAKE_JWKS_FN);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkJwtService,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CLERK_JWT_KEY')
                return 'https://clerk.example.com/.well-known/jwks.json';
              if (key === 'CLERK_JWT_ISSUER')
                return 'https://clerk.example.com';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ClerkJwtService>(ClerkJwtService);
    configService = module.get(TwentyConfigService);
  });

  describe('verify()', () => {
    it('should return claims when JWT is valid', async () => {
      const expectedClaims = {
        sub: 'user_abc123',
        email: 'test@example.com',
        first_name: 'Alice',
        last_name: 'Smith',
        workspace_id: 'ws_xyz',
        iss: 'https://clerk.example.com',
      };

      mockJwtVerify.mockResolvedValueOnce({ payload: expectedClaims });

      const result = await service.verify('valid.jwt.token');

      expect(result).toEqual(expectedClaims);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        'valid.jwt.token',
        FAKE_JWKS_FN,
        { issuer: 'https://clerk.example.com' },
      );
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('signature mismatch'));

      await expect(service.verify('bad.jwt.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('exp claim check failed'));

      await expect(service.verify('expired.jwt.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getJwks() (via verify())', () => {
    it('should throw Error when CLERK_JWT_KEY is not configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'CLERK_JWT_KEY') return '';
        return undefined;
      });

      // reset cached JWKS so the service tries to build it again
      (service as any).jwksCache = null;

      await expect(service.verify('any.token')).rejects.toThrow(
        'CLERK_JWT_KEY (JWKS URL) not configured',
      );
    });

    it('should reuse the cached JWKS function on repeated calls', async () => {
      const claims = { sub: 'user_1' };

      mockJwtVerify.mockResolvedValue({ payload: claims });

      await service.verify('token.one');
      await service.verify('token.two');

      // createRemoteJWKSet is called only once across both verifications
      expect(mockCreateRemoteJWKSet).toHaveBeenCalledTimes(1);
    });
  });
});

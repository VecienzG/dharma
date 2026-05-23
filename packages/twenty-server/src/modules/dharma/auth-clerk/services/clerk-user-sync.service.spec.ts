import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { ClerkUserSyncService } from './clerk-user-sync.service';

const USER_REPO_TOKEN = getRepositoryToken(UserEntity);
const WORKSPACE_REPO_TOKEN = getRepositoryToken(WorkspaceEntity);

describe('ClerkUserSyncService', () => {
  let service: ClerkUserSyncService;
  let userRepository: jest.Mocked<
    Record<string, jest.Mock>
  >;
  let workspaceRepository: jest.Mocked<Record<string, jest.Mock>>;
  let userWorkspaceService: jest.Mocked<
    Pick<UserWorkspaceService, 'addUserToWorkspaceIfUserNotInWorkspace'>
  >;

  const MOCK_USER: Partial<UserEntity> = {
    id: 'user-uuid-1',
    clerkUserId: 'clerk_abc',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
  };

  const MOCK_WORKSPACE: Partial<WorkspaceEntity> = {
    id: 'ws-uuid-1',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    userRepository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(MOCK_USER),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    workspaceRepository = {
      findOneByOrFail: jest
        .fn()
        .mockResolvedValue(MOCK_WORKSPACE),
      find: jest.fn().mockResolvedValue([MOCK_WORKSPACE]),
    };

    userWorkspaceService = {
      addUserToWorkspaceIfUserNotInWorkspace: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkUserSyncService,
        {
          provide: USER_REPO_TOKEN,
          useValue: userRepository,
        },
        {
          provide: WORKSPACE_REPO_TOKEN,
          useValue: workspaceRepository,
        },
        {
          provide: UserWorkspaceService,
          useValue: userWorkspaceService,
        },
      ],
    }).compile();

    service = module.get<ClerkUserSyncService>(ClerkUserSyncService);
  });

  describe('upsertFromClaims()', () => {
    it('should create user and return workspaceId when requestedWorkspaceId is provided', async () => {
      const claims = {
        sub: 'clerk_abc',
        primary_email_address: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Smith',
      };

      const result = await service.upsertFromClaims(claims, 'ws-uuid-1');

      expect(userRepository.upsert).toHaveBeenCalledTimes(1);
      expect(workspaceRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: 'ws-uuid-1',
      });
      expect(
        userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace,
      ).toHaveBeenCalledWith(MOCK_USER, MOCK_WORKSPACE);
      expect(result).toEqual({ user: MOCK_USER, workspaceId: 'ws-uuid-1' });
    });

    it('should use workspace_id from claims when requestedWorkspaceId is not provided', async () => {
      const claims = {
        sub: 'clerk_abc',
        email: 'alice@example.com',
        workspace_id: 'ws-from-claim',
      };

      const result = await service.upsertFromClaims(claims);

      expect(workspaceRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: 'ws-from-claim',
      });
      expect(result.workspaceId).toBe('ws-from-claim');
    });

    it('should fall back to first workspace when no workspaceId is available', async () => {
      const claims = { sub: 'clerk_abc', email: 'alice@example.com' };

      const result = await service.upsertFromClaims(claims);

      expect(workspaceRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
        take: 1,
      });
      expect(result.workspaceId).toBe('ws-uuid-1');
    });

    it('should throw NotFoundException when no workspace exists and no workspaceId provided', async () => {
      workspaceRepository.find.mockResolvedValueOnce([]);

      const claims = { sub: 'clerk_abc', email: 'alice@example.com' };

      await expect(service.upsertFromClaims(claims)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use clerkUserId@unknown.local as email when claims have no email', async () => {
      const claims = { sub: 'clerk_noemail' };

      await service.upsertFromClaims(claims, 'ws-uuid-1');

      expect(userRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'clerk_noemail@unknown.local',
          clerkUserId: 'clerk_noemail',
        }),
        expect.anything(),
      );
    });
  });

  describe('upsertFromWebhook()', () => {
    it('should extract primary email address correctly', async () => {
      const webhookUser = {
        id: 'clerk_webhook_user',
        email_addresses: [
          { id: 'em_secondary', email_address: 'other@example.com' },
          { id: 'em_primary', email_address: 'primary@example.com' },
        ],
        primary_email_address_id: 'em_primary',
        first_name: 'Bob',
        last_name: 'Jones',
      };

      await service.upsertFromWebhook(webhookUser);

      expect(userRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'primary@example.com',
          clerkUserId: 'clerk_webhook_user',
          firstName: 'Bob',
          lastName: 'Jones',
        }),
        expect.anything(),
      );
    });

    it('should fall back to first email address when primary_email_address_id does not match', async () => {
      const webhookUser = {
        id: 'clerk_no_primary',
        email_addresses: [
          { id: 'em_only', email_address: 'fallback@example.com' },
        ],
        primary_email_address_id: 'em_nonexistent',
        first_name: null,
        last_name: null,
      };

      await service.upsertFromWebhook(webhookUser);

      expect(userRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'fallback@example.com' }),
        expect.anything(),
      );
    });

    it('should throw when no email addresses are present in webhook payload', async () => {
      const webhookUser = {
        id: 'clerk_no_email',
        email_addresses: [],
        primary_email_address_id: null,
        first_name: null,
        last_name: null,
      };

      await expect(service.upsertFromWebhook(webhookUser)).rejects.toThrow(
        'Missing email in webhook payload',
      );
    });
  });

  describe('softDelete()', () => {
    it('should soft-delete user when found', async () => {
      await service.softDelete('clerk_abc');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { clerkUserId: 'clerk_abc' },
      });
      expect(userRepository.softDelete).toHaveBeenCalledWith({
        id: MOCK_USER.id,
      });
    });

    it('should not throw when user is not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.softDelete('clerk_gone')).resolves.toBeUndefined();
      expect(userRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});

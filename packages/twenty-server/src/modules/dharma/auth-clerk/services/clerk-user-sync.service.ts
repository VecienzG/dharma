import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { ClerkClaims } from './clerk-jwt.service';

interface ClerkWebhookUser {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
}

@Injectable()
export class ClerkUserSyncService {
  private readonly logger = new Logger(ClerkUserSyncService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly userWorkspaceService: UserWorkspaceService,
  ) {}

  /**
   * Called by exchange controller. Lazy-creates user if webhook
   * has not yet arrived. Idempotent on clerkUserId.
   */
  async upsertFromClaims(
    claims: ClerkClaims,
    requestedWorkspaceId?: string,
  ): Promise<{ user: UserEntity; workspaceId: string }> {
    const clerkUserId = claims.sub;
    const email =
      claims.primary_email_address ??
      claims.email ??
      `${clerkUserId}@unknown.local`;

    const user = await this.upsertUser({
      clerkUserId,
      email,
      firstName: claims.first_name ?? '',
      lastName: claims.last_name ?? '',
    });

    const workspaceId = await this.resolveWorkspaceId(
      requestedWorkspaceId ?? claims.workspace_id,
    );

    const workspace = await this.workspaceRepository.findOneByOrFail({
      id: workspaceId,
    });

    await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
      user,
      workspace,
    );

    return { user, workspaceId };
  }

  async upsertFromWebhook(data: ClerkWebhookUser): Promise<UserEntity> {
    const primary = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );
    const email =
      primary?.email_address ?? data.email_addresses[0]?.email_address;
    if (!email) throw new Error('Missing email in webhook payload');
    return this.upsertUser({
      clerkUserId: data.id,
      email,
      firstName: data.first_name ?? '',
      lastName: data.last_name ?? '',
    });
  }

  async softDelete(clerkUserId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { clerkUserId } });
    if (!user) return;
    await this.userRepository.softDelete({ id: user.id });
  }

  /**
   * Race-safe upsert. Two concurrent calls (exchange + webhook) end
   * up with one row keyed on clerkUserId.
   */
  private async upsertUser(input: {
    clerkUserId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    await this.userRepository.upsert(
      {
        clerkUserId: input.clerkUserId,
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        isEmailVerified: true,
      },
      { conflictPaths: ['clerkUserId'], skipUpdateIfNoValuesChanged: true },
    );
    const user = await this.userRepository.findOne({
      where: { clerkUserId: input.clerkUserId, deletedAt: IsNull() },
    });
    if (!user)
      throw new NotFoundException(
        `User not found after upsert (${input.clerkUserId})`,
      );
    return user;
  }

  private async resolveWorkspaceId(requested?: string): Promise<string> {
    if (requested) return requested;
    const first = await this.workspaceRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!first[0]) throw new NotFoundException('No workspace available');
    return first[0].id;
  }
}

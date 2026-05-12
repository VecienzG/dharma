import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  EmailingDomainDriverException,
  EmailingDomainDriverExceptionCode,
} from 'src/engine/core-modules/emailing-domain/drivers/exceptions/emailing-domain-driver.exception';
import { EmailingDomainDriverFactory } from 'src/engine/core-modules/emailing-domain/drivers/emailing-domain-driver.factory';
import {
  EmailingDomainDriver,
  EmailingDomainStatus,
} from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain';
import {
  type EmailingDomainEmailContent,
  type EmailingDomainSendEmailInput,
  type EmailingDomainSendEmailResult,
} from 'src/engine/core-modules/emailing-domain/drivers/types/send-email';
import { EmailingDomainEntity } from 'src/engine/core-modules/emailing-domain/emailing-domain.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class EmailingDomainService {
  private readonly logger = new Logger(EmailingDomainService.name);

  constructor(
    @InjectRepository(EmailingDomainEntity)
    private readonly emailingDomainRepository: Repository<EmailingDomainEntity>,
    private readonly emailingDomainDriverFactory: EmailingDomainDriverFactory,
  ) {}

  async createEmailingDomain(
    domain: string,
    driver: EmailingDomainDriver,
    workspace: WorkspaceEntity,
  ): Promise<EmailingDomainEntity> {
    const existingDomain = await this.emailingDomainRepository.findOneBy({
      domain,
      workspaceId: workspace.id,
    });

    if (existingDomain) {
      throw new Error('Emailing domain already exists for this workspace');
    }

    const driverInstance = this.emailingDomainDriverFactory.getCurrentDriver();
    const verificationResult = await driverInstance.verifyDomain({
      domain,
      workspaceId: workspace.id,
    });

    await this.tryBootstrap(driverInstance, domain, workspace.id);

    const domainToCreate = {
      domain,
      driver,
      workspaceId: workspace.id,
      ...verificationResult,
    };

    const savedDomain =
      await this.emailingDomainRepository.save(domainToCreate);

    return savedDomain;
  }

  async deleteEmailingDomain(
    workspace: WorkspaceEntity,
    emailingDomainId: string,
  ): Promise<void> {
    const emailingDomain = await this.emailingDomainRepository.findOneBy({
      id: emailingDomainId,
      workspaceId: workspace.id,
    });

    if (!emailingDomain) {
      throw new Error('Emailing domain not found');
    }

    try {
      const driver = this.emailingDomainDriverFactory.getCurrentDriver();

      await driver.cleanupDomain({
        domain: emailingDomain.domain,
        workspaceId: emailingDomain.workspaceId,
      });
    } catch (error) {
      this.logger.warn(
        `Driver cleanup for ${emailingDomain.domain} (workspace ${emailingDomain.workspaceId}) failed; removing DB row anyway: ${error}`,
      );
    }

    await this.emailingDomainRepository.delete({
      id: emailingDomain.id,
    });
  }

  async getEmailingDomains(
    workspace: WorkspaceEntity,
  ): Promise<EmailingDomainEntity[]> {
    return await this.emailingDomainRepository.find({
      where: {
        workspaceId: workspace.id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getEmailingDomain(
    workspace: WorkspaceEntity,
    emailingDomainId: string,
  ): Promise<EmailingDomainEntity | null> {
    return await this.emailingDomainRepository.findOneBy({
      id: emailingDomainId,
      workspaceId: workspace.id,
    });
  }

  async verifyEmailingDomain(
    workspace: WorkspaceEntity,
    emailingDomainId: string,
  ): Promise<EmailingDomainEntity> {
    const emailingDomain = await this.getEmailingDomain(
      workspace,
      emailingDomainId,
    );

    if (!emailingDomain) {
      throw new Error('Emailing domain not found');
    }

    // verifyDomain is idempotent against SES; re-running on an already-
    // verified domain refreshes status (catches DKIM revocation) and
    // re-attempts bootstrap so legacy tenants without a reputation entity
    // pick up the policy once SES has provisioned it.
    const driver = this.emailingDomainDriverFactory.getCurrentDriver();
    const verificationResult = await driver.verifyDomain({
      domain: emailingDomain.domain,
      workspaceId: emailingDomain.workspaceId,
    });

    if (verificationResult.status === EmailingDomainStatus.VERIFIED) {
      await this.tryBootstrap(
        driver,
        emailingDomain.domain,
        emailingDomain.workspaceId,
      );
    }

    const updatedDomain = await this.emailingDomainRepository.save({
      ...emailingDomain,
      ...verificationResult,
    });

    return updatedDomain;
  }

  async syncEmailingDomain(
    workspace: WorkspaceEntity,
    emailingDomainId: string,
  ): Promise<EmailingDomainEntity> {
    const emailingDomain = await this.getEmailingDomain(
      workspace,
      emailingDomainId,
    );

    if (!emailingDomain) {
      throw new Error('Emailing domain not found');
    }

    await this.emailingDomainRepository.update(
      {
        id: emailingDomainId,
      },
      {
        verificationRecords: emailingDomain.verificationRecords,
        status: EmailingDomainStatus.PENDING,
      },
    );

    try {
      const driver = this.emailingDomainDriverFactory.getCurrentDriver();
      const statusResult = await driver.getDomainStatus({
        domain: emailingDomain.domain,
        workspaceId: emailingDomain.workspaceId,
      });

      const updatedDomain = await this.emailingDomainRepository.save({
        ...emailingDomain,
        ...statusResult,
      });

      return updatedDomain;
    } catch (error) {
      await this.emailingDomainRepository.update(
        { id: emailingDomainId },
        {
          verificationRecords: emailingDomain.verificationRecords,
          status: emailingDomain.status,
        },
      );

      throw error;
    }
  }

  async sendEmail(
    workspace: WorkspaceEntity,
    emailingDomainId: string,
    input: EmailingDomainEmailContent,
  ): Promise<EmailingDomainSendEmailResult> {
    const emailingDomain = await this.getEmailingDomain(
      workspace,
      emailingDomainId,
    );

    if (!emailingDomain) {
      throw new EmailingDomainDriverException(
        'Emailing domain not found',
        EmailingDomainDriverExceptionCode.NOT_FOUND,
      );
    }

    if (emailingDomain.status !== EmailingDomainStatus.VERIFIED) {
      throw new EmailingDomainDriverException(
        `Emailing domain is not verified (status: ${emailingDomain.status})`,
        EmailingDomainDriverExceptionCode.CONFIGURATION_ERROR,
      );
    }

    const driver = this.emailingDomainDriverFactory.getCurrentDriver();
    const driverInput: EmailingDomainSendEmailInput = {
      workspaceId: workspace.id,
      domain: emailingDomain.domain,
      from: input.from ?? `noreply@${emailingDomain.domain}`,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    };

    return driver.sendEmail(driverInput);
  }

  private async tryBootstrap(
    driver: ReturnType<EmailingDomainDriverFactory['getCurrentDriver']>,
    domain: string,
    workspaceId: string,
  ): Promise<void> {
    try {
      await driver.bootstrap({ domain, workspaceId });
    } catch (error) {
      this.logger.warn(
        `Bootstrap for ${domain} (workspace ${workspaceId}) failed; user can retry via verify: ${error}`,
      );
    }
  }
}

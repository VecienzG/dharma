import {
  type EmailingDomainSendEmailInput,
  type EmailingDomainSendEmailResult,
} from 'src/engine/core-modules/emailing-domain/drivers/types/send-email';
import { type EmailingDomainStatus } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain';
import { type VerificationRecord } from 'src/engine/core-modules/emailing-domain/drivers/types/verifications-record';

export type DomainVerificationInput = {
  domain: string;
  workspaceId: string;
};

export type DomainStatusInput = {
  domain: string;
  workspaceId: string;
};

export type DomainBootstrapInput = {
  domain: string;
  workspaceId: string;
};

export type DomainCleanupInput = {
  domain: string;
  workspaceId: string;
};

export type EmailingDomainVerificationResult = {
  status: EmailingDomainStatus;
  verificationRecords: VerificationRecord[];
  verifiedAt: Date | null;
};

export interface EmailingDomainDriverInterface {
  verifyDomain(
    input: DomainVerificationInput,
  ): Promise<EmailingDomainVerificationResult>;
  getDomainStatus(
    input: DomainStatusInput,
  ): Promise<EmailingDomainVerificationResult>;
  bootstrap(input: DomainBootstrapInput): Promise<void>;
  cleanupDomain(input: DomainCleanupInput): Promise<void>;
  sendEmail(
    input: EmailingDomainSendEmailInput,
  ): Promise<EmailingDomainSendEmailResult>;
}

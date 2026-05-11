import { Injectable, Logger } from '@nestjs/common';

import {
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  CreateContactListCommand,
  PutAccountSuppressionAttributesCommand,
  PutEmailIdentityMailFromAttributesCommand,
  UpdateReputationEntityPolicyCommand,
} from '@aws-sdk/client-sesv2';
import { isNonEmptyString } from '@sniptt/guards';

import { type AwsSesDriverConfig } from 'src/engine/core-modules/emailing-domain/drivers/interfaces/driver-config.interface';

import { AWS_SES_EVENT_BUS_NAME } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/constants/aws-ses-event-bus-name.constant';
import { AWS_SES_MAIL_FROM_SUBDOMAIN } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/constants/aws-ses-mail-from-subdomain.constant';
import { AWS_SES_REPUTATION_POLICY } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/constants/aws-ses-reputation-policy.constant';
import { AWS_SES_TRANSACTIONAL_TOPIC_NAME } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/constants/aws-ses-transactional-topic-name.constant';
import { AwsSesClientProvider } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/providers/aws-ses-client.provider';

export type BootstrapInput = {
  domain: string;
  tenantName: string;
  configurationSetName: string;
  contactListName: string;
};

const REPUTATION_POLICY_ARN_BY_KEY: Record<'STANDARD' | 'STRICT', string> = {
  STANDARD: 'arn:aws:ses:%REGION%:aws:reputation-policy/standard',
  STRICT: 'arn:aws:ses:%REGION%:aws:reputation-policy/strict',
};

@Injectable()
export class AwsSesBootstrapService {
  private readonly logger = new Logger(AwsSesBootstrapService.name);

  constructor(private readonly awsSesClientProvider: AwsSesClientProvider) {}

  async bootstrap(
    input: BootstrapInput,
    config: AwsSesDriverConfig,
  ): Promise<void> {
    await this.ensureAccountSuppressionEnabled();
    await this.ensureConfigurationSet(input.configurationSetName);
    await this.ensureEventDestination(input.configurationSetName, config);
    await this.ensureContactList(input.contactListName);
    await this.attachReputationPolicy(input.tenantName, config);
    await this.configureCustomMailFrom(input.domain);
  }

  private async ensureAccountSuppressionEnabled(): Promise<void> {
    const sesClient = this.awsSesClientProvider.getSESClient();

    await sesClient.send(
      new PutAccountSuppressionAttributesCommand({
        SuppressedReasons: ['BOUNCE', 'COMPLAINT'],
      }),
    );
  }

  private async ensureConfigurationSet(name: string): Promise<void> {
    const sesClient = this.awsSesClientProvider.getSESClient();

    try {
      await sesClient.send(
        new CreateConfigurationSetCommand({
          ConfigurationSetName: name,
          ReputationOptions: { ReputationMetricsEnabled: true },
          SendingOptions: { SendingEnabled: true },
          SuppressionOptions: { SuppressedReasons: ['BOUNCE', 'COMPLAINT'] },
          Tags: [{ Key: 'managed-by', Value: 'twenty' }],
        }),
      );
      this.logger.log(`Created configuration set: ${name}`);
    } catch (error) {
      if (error?.name !== 'AlreadyExistsException') {
        throw error;
      }
    }
  }

  private async ensureEventDestination(
    configurationSetName: string,
    config: AwsSesDriverConfig,
  ): Promise<void> {
    const sesClient = this.awsSesClientProvider.getSESClient();
    const eventBusArn = `arn:aws:events:${config.region}:${config.accountId}:event-bus/${AWS_SES_EVENT_BUS_NAME}`;

    try {
      await sesClient.send(
        new CreateConfigurationSetEventDestinationCommand({
          ConfigurationSetName: configurationSetName,
          EventDestinationName: 'twenty-eventbridge',
          EventDestination: {
            Enabled: true,
            MatchingEventTypes: [
              'SEND',
              'DELIVERY',
              'BOUNCE',
              'COMPLAINT',
              'REJECT',
              'RENDERING_FAILURE',
              'DELIVERY_DELAY',
              'SUBSCRIPTION',
            ],
            EventBridgeDestination: { EventBusArn: eventBusArn },
          },
        }),
      );
      this.logger.log(
        `Created event destination for ${configurationSetName} -> ${eventBusArn}`,
      );
    } catch (error) {
      if (error?.name !== 'AlreadyExistsException') {
        throw error;
      }
    }
  }

  private async ensureContactList(name: string): Promise<void> {
    const sesClient = this.awsSesClientProvider.getSESClient();

    try {
      await sesClient.send(
        new CreateContactListCommand({
          ContactListName: name,
          Topics: [
            {
              TopicName: AWS_SES_TRANSACTIONAL_TOPIC_NAME,
              DisplayName: 'Transactional',
              DefaultSubscriptionStatus: 'OPT_IN',
            },
          ],
          Tags: [{ Key: 'managed-by', Value: 'twenty' }],
        }),
      );
      this.logger.log(`Created contact list: ${name}`);
    } catch (error) {
      if (error?.name !== 'AlreadyExistsException') {
        throw error;
      }
    }
  }

  private async attachReputationPolicy(
    tenantName: string,
    config: AwsSesDriverConfig,
  ): Promise<void> {
    if (AWS_SES_REPUTATION_POLICY === 'NONE') {
      return;
    }

    const sesClient = this.awsSesClientProvider.getSESClient();
    const tenantArn = `arn:aws:ses:${config.region}:${config.accountId}:tenant/${tenantName}`;
    const policyArn = REPUTATION_POLICY_ARN_BY_KEY[
      AWS_SES_REPUTATION_POLICY
    ].replace('%REGION%', config.region);

    try {
      await sesClient.send(
        new UpdateReputationEntityPolicyCommand({
          ReputationEntityType: 'RESOURCE',
          ReputationEntityReference: tenantArn,
          ReputationEntityPolicy: policyArn,
        }),
      );
      this.logger.log(
        `Attached ${AWS_SES_REPUTATION_POLICY} reputation policy to ${tenantArn}`,
      );
    } catch (error) {
      // SES provisions the reputation entity for a tenant lazily — for new
      // tenants and tenants created before tenant-isolation launched it
      // does not exist until first sending activity. Next bootstrap run
      // will pick it up.
      if (this.isMissingReputationEntityError(error)) {
        this.logger.warn(
          `Reputation entity not yet provisioned for ${tenantArn}; policy will be attached on next bootstrap run.`,
        );

        return;
      }
      throw error;
    }
  }

  private async configureCustomMailFrom(domain: string): Promise<void> {
    if (!isNonEmptyString(AWS_SES_MAIL_FROM_SUBDOMAIN)) {
      return;
    }

    const sesClient = this.awsSesClientProvider.getSESClient();

    await sesClient.send(
      new PutEmailIdentityMailFromAttributesCommand({
        EmailIdentity: domain,
        MailFromDomain: `${AWS_SES_MAIL_FROM_SUBDOMAIN}.${domain}`,
        BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
      }),
    );
    this.logger.log(
      `Configured custom MAIL FROM ${AWS_SES_MAIL_FROM_SUBDOMAIN}.${domain} for ${domain}`,
    );
  }

  private isMissingReputationEntityError(error: {
    name?: string;
    message?: string;
  }): boolean {
    if (error?.name === 'NotFoundException') {
      return true;
    }

    return (
      error?.name === 'BadRequestException' &&
      error?.message?.includes('does not exist') === true
    );
  }
}

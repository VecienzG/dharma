import {
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  CreateContactListCommand,
  PutAccountSuppressionAttributesCommand,
  PutEmailIdentityMailFromAttributesCommand,
  UpdateReputationEntityPolicyCommand,
} from '@aws-sdk/client-sesv2';

import { type AwsSesClientProvider } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/providers/aws-ses-client.provider';
import { AwsSesBootstrapService } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/services/aws-ses-bootstrap.service';
import { type AwsSesHandleErrorService } from 'src/engine/core-modules/emailing-domain/drivers/aws-ses/services/aws-ses-handle-error.service';
import { type AwsSesDriverConfig } from 'src/engine/core-modules/emailing-domain/drivers/interfaces/driver-config.interface';
import { EmailingDomainDriver } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain';

const buildAlreadyExistsError = (): Error => {
  const error = new Error('Already exists');

  (error as Error & { name: string }).name = 'AlreadyExistsException';

  return error;
};

describe('AwsSesBootstrapService', () => {
  const config: AwsSesDriverConfig = {
    driver: EmailingDomainDriver.AWS_SES,
    region: 'us-east-1',
    accountId: '123456789012',
  };

  const input = {
    domain: 'mail.example.com',
    tenantName: 'twenty-workspace-ws1',
    configurationSetName: 'twenty-workspace-ws1',
    contactListName: 'twenty-workspace-ws1',
  };

  const setUp = () => {
    const send = jest.fn();
    const clientProvider = {
      getSESClient: () => ({ send }),
    } as unknown as AwsSesClientProvider;
    const handleErrorService = {
      handleAwsSesError: jest.fn((error) => {
        throw error;
      }),
    } as unknown as AwsSesHandleErrorService;
    const service = new AwsSesBootstrapService(
      clientProvider,
      handleErrorService,
    );

    return { service, send, handleErrorService };
  };

  describe('when bootstrap is called for a fresh tenant', () => {
    it('should issue all setup commands in sequence', async () => {
      const { service, send } = setUp();

      send.mockResolvedValue({});

      await service.bootstrap(input, config);

      const commandTypes = send.mock.calls.map(
        ([command]) => command.constructor.name,
      );

      expect(commandTypes).toEqual([
        PutAccountSuppressionAttributesCommand.name,
        CreateConfigurationSetCommand.name,
        CreateConfigurationSetEventDestinationCommand.name,
        CreateContactListCommand.name,
        UpdateReputationEntityPolicyCommand.name,
        PutEmailIdentityMailFromAttributesCommand.name,
      ]);
    });

    it('should attach the standard reputation policy with the regional ARN', async () => {
      const { service, send } = setUp();

      send.mockResolvedValue({});

      await service.bootstrap(input, config);

      const reputationCall = send.mock.calls.find(
        ([command]) => command instanceof UpdateReputationEntityPolicyCommand,
      );

      expect(reputationCall?.[0].input).toMatchObject({
        ReputationEntityType: 'RESOURCE',
        ReputationEntityReference:
          'arn:aws:ses:us-east-1:123456789012:tenant/twenty-workspace-ws1',
        ReputationEntityPolicy:
          'arn:aws:ses:us-east-1:aws:reputation-policy/standard',
      });
    });

    it('should configure custom MAIL FROM using the bounce subdomain', async () => {
      const { service, send } = setUp();

      send.mockResolvedValue({});

      await service.bootstrap(input, config);

      const mailFromCall = send.mock.calls.find(
        ([command]) =>
          command instanceof PutEmailIdentityMailFromAttributesCommand,
      );

      expect(mailFromCall?.[0].input).toMatchObject({
        EmailIdentity: 'mail.example.com',
        MailFromDomain: 'bounce.mail.example.com',
        BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
      });
    });
  });

  describe('when bootstrap is called on a tenant that already has resources', () => {
    it('should swallow AlreadyExistsException for idempotent creates', async () => {
      const { service, send } = setUp();

      send.mockImplementation(async (command) => {
        if (
          command instanceof CreateConfigurationSetCommand ||
          command instanceof CreateConfigurationSetEventDestinationCommand ||
          command instanceof CreateContactListCommand
        ) {
          throw buildAlreadyExistsError();
        }

        return {};
      });

      await expect(service.bootstrap(input, config)).resolves.toBeUndefined();
    });

    it('should propagate non-idempotent AWS errors via handle-error service', async () => {
      const { service, send, handleErrorService } = setUp();
      const fatalError = Object.assign(new Error('Boom'), {
        name: 'AccessDeniedException',
      });

      send.mockImplementation(async (command) => {
        if (command instanceof CreateConfigurationSetCommand) {
          throw fatalError;
        }

        return {};
      });

      await expect(service.bootstrap(input, config)).rejects.toBe(fatalError);
      expect(handleErrorService.handleAwsSesError).toHaveBeenCalledWith(
        fatalError,
        'bootstrap',
      );
    });
  });
});

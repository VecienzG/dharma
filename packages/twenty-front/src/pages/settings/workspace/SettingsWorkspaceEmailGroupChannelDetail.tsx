import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { SettingsAccountsMessageChannelDetails } from '@/settings/accounts/components/SettingsAccountsMessageChannelDetails';
import { useDeleteEmailGroupChannel } from '@/settings/accounts/hooks/useDeleteEmailGroupChannel';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { MessageChannelType, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { H2Title, IconCopy, IconTrash } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  EmailingDomainStatus,
  GetEmailingDomainsDocument,
  type GetEmailingDomainsQuery,
} from '~/generated-metadata/graphql';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

const DELETE_EMAIL_GROUP_MODAL_ID = 'delete-email-group-channel-modal';

const StyledForwardingRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const StyledForwardingInputContainer = styled.div`
  flex: 1;
  margin-right: ${themeCssVariables.spacing[2]};
`;

export const SettingsWorkspaceEmailGroupChannelDetail = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const navigateSettings = useNavigateSettings();
  const { messageChannelId } = useParams<{ messageChannelId: string }>();
  const { channels, loading } = useMyMessageChannels();
  const { data: emailingDomainsData } = useQuery<GetEmailingDomainsQuery>(
    GetEmailingDomainsDocument,
  );
  const { copyToClipboard } = useCopyToClipboard();
  const { openModal } = useModal();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { deleteEmailGroupChannel, loading: deleting } =
    useDeleteEmailGroupChannel();

  if (loading) {
    return null;
  }

  const channel = channels.find(
    (channel) =>
      channel.id === messageChannelId &&
      channel.type === MessageChannelType.EMAIL_GROUP,
  );

  if (!isDefined(channel)) {
    return <Navigate to={getSettingsPath(SettingsPath.Workspace)} replace />;
  }

  const sourceHandle = channel.connectedAccount?.handle ?? channel.handle;
  const forwardingAddress = channel.handle;
  const sourceDomain = sourceHandle.split('@')[1];
  const matchingEmailingDomain = emailingDomainsData?.getEmailingDomains?.find(
    (emailingDomain) => emailingDomain.domain === sourceDomain,
  );
  const isOutboundEnabled =
    matchingEmailingDomain?.status === EmailingDomainStatus.VERIFIED;

  const handleDelete = async () => {
    try {
      await deleteEmailGroupChannel(channel.id);
      navigate(-1);
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to delete email handle.`,
      });
    }
  };

  return (
    <SubMenuTopBarContainer
      title={sourceHandle}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        {
          children: t`General`,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: sourceHandle },
      ]}
      actionButton={
        <Button
          Icon={IconTrash}
          title={t`Delete`}
          variant="secondary"
          accent="danger"
          size="small"
          disabled={deleting}
          onClick={() => openModal(DELETE_EMAIL_GROUP_MODAL_ID)}
        />
      }
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Source address`}
            description={t`The address your workspace sends and receives email from.`}
          />
          <SettingsTextInput
            instanceId="email-group-source"
            value={sourceHandle}
            disabled
            fullWidth
          />
        </Section>
        <Section>
          <H2Title
            title={t`Forwarding address`}
            description={t`Set up forwarding from the source address to this destination.`}
          />
          <StyledForwardingRow>
            <StyledForwardingInputContainer>
              <SettingsTextInput
                instanceId="email-group-forwarding"
                value={forwardingAddress}
                disabled
                fullWidth
              />
            </StyledForwardingInputContainer>
            <Button
              Icon={IconCopy}
              title={t`Copy`}
              onClick={() =>
                copyToClipboard(
                  forwardingAddress,
                  t`Forwarding address copied to clipboard`,
                )
              }
            />
          </StyledForwardingRow>
        </Section>
        <Section>
          <H2Title
            title={t`Outbound sending`}
            description={
              isOutboundEnabled
                ? t`Outbound is enabled. Replies from ${sourceHandle} will go out through ${sourceDomain}.`
                : isDefined(matchingEmailingDomain)
                  ? t`${sourceDomain} is registered but not verified yet. Finish DNS verification to enable outbound.`
                  : t`No outbound domain configured for ${sourceDomain}. Add it under Outbound Domains to send mail from this handle.`
            }
          />
          {!isOutboundEnabled && (
            <Button
              title={
                isDefined(matchingEmailingDomain)
                  ? t`Verify ${sourceDomain}`
                  : t`Add outbound domain`
              }
              variant="secondary"
              size="small"
              onClick={() =>
                isDefined(matchingEmailingDomain)
                  ? navigateSettings(SettingsPath.EmailingDomainDetail, {
                      domainId: matchingEmailingDomain.id,
                    })
                  : navigateSettings(SettingsPath.NewEmailingDomain)
              }
            />
          )}
        </Section>
        <SettingsAccountsMessageChannelDetails messageChannel={channel} />
      </SettingsPageContainer>
      <ConfirmationModal
        modalInstanceId={DELETE_EMAIL_GROUP_MODAL_ID}
        title={t`Delete email handle`}
        subtitle={t`Are you sure you want to delete ${sourceHandle}? Inbound mail forwarded to this address and outbound replies from it will stop working.`}
        onConfirmClick={handleDelete}
        confirmButtonText={t`Delete`}
        confirmButtonAccent="danger"
        loading={deleting}
      />
    </SubMenuTopBarContainer>
  );
};

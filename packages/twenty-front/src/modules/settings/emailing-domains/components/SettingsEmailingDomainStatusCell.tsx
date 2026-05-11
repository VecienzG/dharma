import { styled } from '@linaria/react';

import { SettingsEmailingDomainRowDropdownMenu } from '@/settings/emailing-domains/components/SettingsEmailingDomainRowDropdownMenu';
import { type GetEmailingDomainsQuery } from '~/generated-metadata/graphql';
import { getColorByEmailingDomainStatus } from '~/pages/settings/emailing-domains/utils/getEmailingDomainStatusColor';
import { getTextByEmailingDomainStatus } from '~/pages/settings/emailing-domains/utils/getEmailingDomainStatusText';
import { Status } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledStatusCell = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

type SettingsEmailingDomainStatusCellProps = {
  item: GetEmailingDomainsQuery['getEmailingDomains'][0];
};

export const SettingsEmailingDomainStatusCell = ({
  item,
}: SettingsEmailingDomainStatusCellProps) => (
  <StyledStatusCell>
    <Status
      color={getColorByEmailingDomainStatus(item.status)}
      text={getTextByEmailingDomainStatus(item.status)}
    />
    <SettingsEmailingDomainRowDropdownMenu emailingDomain={item} />
  </StyledStatusCell>
);

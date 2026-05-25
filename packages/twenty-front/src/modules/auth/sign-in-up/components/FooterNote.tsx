import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { Link } from 'react-router-dom';

import { useWorkspaceBypass } from '@/auth/sign-in-up/hooks/useWorkspaceBypass';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCopyContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  max-width: 280px;
  text-align: center;

  & > a {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledLinksContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: nowrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;

  & > a,
  & > button {
    background: none;
    border: none;
    color: ${themeCssVariables.font.color.tertiary};
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledSeparator = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

export const FooterNote = () => {
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();

  const { shouldOfferBypass, shouldUseBypass, enableBypass } =
    useWorkspaceBypass();

  if (!isOnAWorkspace) {
    return (
      <StyledCopyContainer>
        <Trans>By using Twenty, you agree to the</Trans>{' '}
        <Link to={AppPath.DharmaLegalTerms}>
          <Trans>Terms of Service</Trans>
        </Link>{' '}
        <Trans>and</Trans>{' '}
        <Link to={AppPath.DharmaLegalPrivacy}>
          <Trans>Privacy Policy</Trans>
        </Link>
        .
      </StyledCopyContainer>
    );
  }

  return (
    <StyledLinksContainer>
      {shouldOfferBypass && !shouldUseBypass && (
        <>
          <button type="button" onClick={enableBypass}>
            <Trans>Bypass SSO</Trans>
          </button>
          <StyledSeparator>•</StyledSeparator>
        </>
      )}
      <Link to={AppPath.DharmaLegalPrivacy}>
        <Trans>Privacy Policy</Trans>
      </Link>
      <StyledSeparator>•</StyledSeparator>
      <Link to={AppPath.DharmaLegalTerms}>
        <Trans>Terms of Service</Trans>
      </Link>
    </StyledLinksContainer>
  );
};

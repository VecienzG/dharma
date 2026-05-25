import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  margin: 0 auto;
  max-width: 720px;
  padding: ${themeCssVariables.spacing[10]} ${themeCssVariables.spacing[6]};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.h2`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: ${themeCssVariables.spacing[4]} 0 0;
`;

const StyledParagraph = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.6;
  margin: 0;
`;

const StyledNotice = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledBackLink = styled(Link)`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// Static placeholder privacy page. Linked from FooterNote on the sign-in screen.
// Replace placeholder copy with finalized privacy policy before public release.
export const DharmaLegalPrivacyPage = () => {
  return (
    <StyledContainer>
      <StyledBackLink to={AppPath.SignInUp}>{'← Back'}</StyledBackLink>
      <StyledTitle>Privacy Policy</StyledTitle>
      <StyledNotice>
        Draft — this policy is provisional. For questions or a finalized copy,
        contact the workspace owner.
      </StyledNotice>

      <StyledSubtitle>1. Data Controller</StyledSubtitle>
      <StyledParagraph>
        TODO: identify the data controller (legal entity, address, contact) per
        GDPR art. 13.
      </StyledParagraph>

      <StyledSubtitle>2. Data We Collect</StyledSubtitle>
      <StyledParagraph>
        TODO: enumerate categories (account, workspace records, calendar
        connections, finance entries, AI memory). Distinguish user-provided vs
        derived.
      </StyledParagraph>

      <StyledSubtitle>3. Purposes &amp; Legal Basis</StyledSubtitle>
      <StyledParagraph>
        TODO: state purposes (service operation, AI suggestions, analytics) and
        the GDPR legal basis for each (contract, legitimate interest, consent).
      </StyledParagraph>

      <StyledSubtitle>4. AI Processing</StyledSubtitle>
      <StyledParagraph>
        TODO: disclose AI model providers, what is sent, retention by provider,
        and opt-out mechanism (if any).
      </StyledParagraph>

      <StyledSubtitle>5. Sharing &amp; Sub-Processors</StyledSubtitle>
      <StyledParagraph>
        TODO: list sub-processors (hosting, email, AI providers, payment) with
        purpose and region.
      </StyledParagraph>

      <StyledSubtitle>6. Retention</StyledSubtitle>
      <StyledParagraph>
        TODO: per-category retention windows, post-termination deletion
        timeline, and backup retention.
      </StyledParagraph>

      <StyledSubtitle>7. Your Rights</StyledSubtitle>
      <StyledParagraph>
        TODO: GDPR rights (access, rectification, erasure, portability,
        objection) and how to exercise them.
      </StyledParagraph>

      <StyledSubtitle>8. International Transfers</StyledSubtitle>
      <StyledParagraph>
        TODO: declare cross-border transfers and the safeguard mechanism (SCCs,
        adequacy decision).
      </StyledParagraph>

      <StyledSubtitle>Contact</StyledSubtitle>
      <StyledParagraph>
        For privacy-related requests, please contact the workspace owner.
      </StyledParagraph>
    </StyledContainer>
  );
};

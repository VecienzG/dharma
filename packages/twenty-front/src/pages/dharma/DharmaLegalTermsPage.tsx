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

// Static placeholder legal page. Linked from FooterNote on the sign-in screen.
// Replace placeholder copy with finalized terms before public release.
export const DharmaLegalTermsPage = () => {
  return (
    <StyledContainer>
      <StyledBackLink to={AppPath.SignInUp}>{'← Back'}</StyledBackLink>
      <StyledTitle>Terms of Service</StyledTitle>
      <StyledNotice>
        Draft — these terms are provisional. For questions or a finalized copy,
        contact the workspace owner.
      </StyledNotice>

      <StyledSubtitle>1. Acceptance</StyledSubtitle>
      <StyledParagraph>
        TODO: define acceptance of terms, scope of service, and the legal entity
        operating the Dharma instance.
      </StyledParagraph>

      <StyledSubtitle>2. Account &amp; Workspace</StyledSubtitle>
      <StyledParagraph>
        TODO: describe account responsibilities, workspace ownership, and
        eligibility.
      </StyledParagraph>

      <StyledSubtitle>3. Acceptable Use</StyledSubtitle>
      <StyledParagraph>
        TODO: enumerate acceptable-use rules, prohibited activities, and
        consequences.
      </StyledParagraph>

      <StyledSubtitle>4. Data &amp; Content</StyledSubtitle>
      <StyledParagraph>
        TODO: clarify content ownership, data retention, and AI-derived outputs.
      </StyledParagraph>

      <StyledSubtitle>5. Termination</StyledSubtitle>
      <StyledParagraph>
        TODO: termination triggers, data export window, and obligations after
        termination.
      </StyledParagraph>

      <StyledSubtitle>6. Liability</StyledSubtitle>
      <StyledParagraph>
        TODO: limitation of liability and disclaimer of warranties.
      </StyledParagraph>

      <StyledSubtitle>7. Governing Law</StyledSubtitle>
      <StyledParagraph>
        TODO: jurisdiction (Italian law expected) and dispute-resolution venue.
      </StyledParagraph>

      <StyledSubtitle>Contact</StyledSubtitle>
      <StyledParagraph>
        For questions regarding these terms, please contact the workspace owner.
      </StyledParagraph>
    </StyledContainer>
  );
};

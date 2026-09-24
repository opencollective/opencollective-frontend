import React from 'react';
import { FormattedMessage } from 'react-intl';

import SignInOrJoinFree from '../SignInOrJoinFree';
import StyledButton from '../StyledButton';

const SignInToContributeAsAnOrganization = ({ onCancel, ...props }) => {
  return (
    <React.Fragment>
      <StyledButton type="button" isBorderless buttonStyle="secondary" mb={3} onClick={onCancel}>
        &larr;{' '}
        <FormattedMessage id="ContributionFlow.goBackToGuest" defaultMessage="Go back to contribute as a guest" />
      </StyledButton>
      <SignInOrJoinFree
        {...props}
        defaultForm="signin"
        createProfileLabels={{
          personal: (
            <FormattedMessage id="ContributionFlow.CreateUserLabel" defaultMessage="Contribute as an individual" />
          ),
          organization: (
            <FormattedMessage
              id="ContributionFlow.CreateOrganizationLabel"
              defaultMessage="Contribute as an organization"
            />
          ),
        }}
      />
    </React.Fragment>
  );
};

export default SignInToContributeAsAnOrganization;

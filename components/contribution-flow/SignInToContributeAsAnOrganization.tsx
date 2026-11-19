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
      <SignInOrJoinFree {...props} defaultForm="signin" />
    </React.Fragment>
  );
};

export default SignInToContributeAsAnOrganization;

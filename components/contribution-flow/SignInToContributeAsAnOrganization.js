import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import SignInOrJoinFreeV2 from '../SignInOrJoinFreeV2';
import StyledButton from '../StyledButton';

const SignInToContributeAsAnOrganization = ({ onCancel, ...props }) => {
  return (
    <React.Fragment>
      <StyledButton type="button" isBorderless buttonStyle="secondary" mb={3} onClick={onCancel}>
        &larr;{' '}
        <FormattedMessage id="ContributionFlow.goBackToGuest" defaultMessage="Go back to contribute as a guest" />
      </StyledButton>
      <SignInOrJoinFreeV2
        {...props}
        defaultForm="signinv2"
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

SignInToContributeAsAnOrganization.propTypes = {
  onCancel: PropTypes.func,
};

export default SignInToContributeAsAnOrganization;

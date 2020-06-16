import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Router } from '../../server/pages';

import StyledButton from '../../components/StyledButton';

class OnboardingSkipButton extends React.Component {
  static propTypes = {
    slug: PropTypes.string,
  };

  render() {
    const { slug } = this.props;

    return (
      <StyledButton
        type="button"
        width="fit-content"
        buttonStyle="primary"
        onClick={() => {
          Router.pushRoute('collective-with-onboarding', { slug });
        }}
      >
        <FormattedMessage id="SkipOnboarding" defaultMessage="Skip onboarding" />
      </StyledButton>
    );
  }
}

export default OnboardingSkipButton;

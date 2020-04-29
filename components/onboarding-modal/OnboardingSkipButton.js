import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Router } from '../../server/pages';

import StyledButton from '../../components/StyledButton';

class OnboardingSkipButton extends React.Component {
  static propTypes = {
    slug: PropTypes.string,
    onClose: PropTypes.func,
  };

  render() {
    const { slug, onClose } = this.props;

    return (
      <StyledButton
        type="button"
        width="fit-content"
        buttonStyle="primary"
        onClick={() => {
          Router.pushRoute('collective-with-onboarding', { slug });
          () => onClose();
        }}
      >
        <FormattedMessage id="SkipOnboarding" defaultMessage="Skip onboarding" />
      </StyledButton>
    );
  }
}

export default OnboardingSkipButton;

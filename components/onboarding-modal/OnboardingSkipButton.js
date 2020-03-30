import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../../components/StyledButton';
import { Router } from '../../server/pages';

class OnboardingSkipButton extends React.Component {
  static propTypes = {
    slug: PropTypes.string,
    onClose: PropTypes.func,
  };

  render() {
    const { slug, onClose } = this.props;

    return (
      <StyledButton
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

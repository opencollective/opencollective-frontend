import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../../components/StyledButton';

class OnboardingSkipButton extends React.Component {
  static propTypes = {
    slug: PropTypes.string,
    router: PropTypes.object,
  };

  render() {
    const { slug } = this.props;

    return (
      <StyledButton
        type="button"
        width="fit-content"
        buttonStyle="primary"
        onClick={() => {
          this.props.router.push(slug);
        }}
      >
        <FormattedMessage id="SkipOnboarding" defaultMessage="Skip onboarding" />
      </StyledButton>
    );
  }
}

export default withRouter(OnboardingSkipButton);

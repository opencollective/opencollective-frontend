import React from 'react';
import type { Router } from 'next/router';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../../components/StyledButton';

type OnboardingSkipButtonProps = {
  slug?: string;
  router: Router;
};

class OnboardingSkipButton extends React.Component<OnboardingSkipButtonProps> {
  render() {
    const { slug } = this.props;

    return (
      <StyledButton
        type="button"
        width="fit-content"
        buttonStyle="primary"
        onClick={() => {
          this.props.router.push(`/${slug}`);
        }}
      >
        <FormattedMessage id="SkipOnboarding" defaultMessage="Skip onboarding" />
      </StyledButton>
    );
  }
}

export default withRouter(OnboardingSkipButton);

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import StyledRoundButton from '../../components/StyledRoundButton';
import StyledButton from '../../components/StyledButton';

import { Router } from '../../server/pages';
import withViewport, { VIEWPORTS } from '../../lib/withViewport';

const params = {
  0: {
    disabled: true,
    routerStepForward: 'administrators',
  },
  1: {
    disabled: false,
    routerStepBack: undefined,
    routerStepForward: 'contact',
  },
  2: {
    disabled: false,
    routerStepBack: 'administrators',
  },
};

class OnboardingNavButtons extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    slug: PropTypes.string,
    mode: PropTypes.string,
    submitCollectiveInfo: PropTypes.func,
    loading: PropTypes.bool,
    viewport: PropTypes.object,
  };

  getStepParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { step, mode, slug, submitCollectiveInfo, loading, viewport } = this.props;

    return (
      <Flex>
        {step === 2 ? (
          <Fragment>
            {viewport === VIEWPORTS.MOBILE ? (
              <StyledButton
                mx={1}
                buttonStyle="primary"
                disabled={this.getStepParams(step, 'disabled')}
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepBack'),
                  });
                }}
              >
                <FormattedMessage id="contribute.prevStep" defaultMessage="Previous step" />
              </StyledButton>
            ) : (
              <StyledRoundButton
                mx={1}
                size={48}
                disabled={this.getStepParams(step, 'disabled')}
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepBack'),
                  });
                }}
              >
                ←
              </StyledRoundButton>
            )}

            <StyledButton buttonStyle="primary" onClick={submitCollectiveInfo} loading={loading}>
              <FormattedMessage id="Finish" defaultMessage="Finish" />
            </StyledButton>
          </Fragment>
        ) : (
          <Fragment>
            {viewport === VIEWPORTS.MOBILE ? (
              <StyledButton
                mx={1}
                buttonStyle="primary"
                disabled={this.getStepParams(step, 'disabled')}
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepBack'),
                  });
                }}
              >
                <FormattedMessage id="contribute.prevStep" defaultMessage="Previous step" />
              </StyledButton>
            ) : (
              <StyledRoundButton
                mx={1}
                size={48}
                disabled={this.getStepParams(step, 'disabled')}
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepBack'),
                  });
                }}
              >
                ←
              </StyledRoundButton>
            )}
            {viewport === VIEWPORTS.MOBILE ? (
              <StyledButton
                mx={1}
                buttonStyle="primary"
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepForward'),
                  });
                }}
              >
                <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />
              </StyledButton>
            ) : (
              <StyledRoundButton
                mx={1}
                size={48}
                onClick={() => {
                  Router.pushRoute('collective-with-onboarding', {
                    slug,
                    mode,
                    step: this.getStepParams(step, 'routerStepForward'),
                  });
                }}
              >
                →
              </StyledRoundButton>
            )}
          </Fragment>
        )}
      </Flex>
    );
  }
}

export default withViewport(OnboardingNavButtons);

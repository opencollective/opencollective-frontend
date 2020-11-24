import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import withViewport, { VIEWPORTS } from '../../lib/withViewport';
import { Router } from '../../server/pages';

import StyledButton from '../../components/StyledButton';
import StyledRoundButton from '../../components/StyledRoundButton';

import { Flex } from '../Grid';

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
    loading: PropTypes.bool,
    viewport: PropTypes.object,
    handleSubmit: PropTypes.func,
  };

  getStepParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { step, mode, slug, loading, viewport, handleSubmit } = this.props;

    return (
      <Flex>
        {step === 2 ? (
          <Fragment>
            {viewport === VIEWPORTS.XSMALL ? (
              <StyledButton
                type="button"
                data-cy="step-back-button"
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
                type="button"
                data-cy="step-back-button"
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

            <StyledButton
              type="submit"
              buttonStyle="primary"
              onClick={() => handleSubmit}
              loading={loading}
              data-cy="finish-button"
            >
              <FormattedMessage id="Finish" defaultMessage="Finish" />
            </StyledButton>
          </Fragment>
        ) : (
          <Fragment>
            {viewport === VIEWPORTS.XSMALL ? (
              <StyledButton
                type="button"
                data-cy="step-back-button"
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
                type="button"
                data-cy="step-back-button"
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
            {viewport === VIEWPORTS.XSMALL ? (
              <StyledButton
                type="button"
                data-cy="step-forward-button"
                mx={1}
                buttonStyle="primary"
                onClick={e => {
                  e.preventDefault();
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
                type="button"
                data-cy="step-forward-button"
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

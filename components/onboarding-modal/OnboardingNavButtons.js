import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import withViewport, { VIEWPORTS } from '../../lib/withViewport';

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
    routerStepBack: '',
    routerStepForward: 'contact-info',
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
    router: PropTypes.object,
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
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepBack')}`);
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
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepBack')}`);
                }}
              >
                ←
              </StyledRoundButton>
            )}

            <StyledButton buttonStyle="primary" onClick={() => handleSubmit} loading={loading} data-cy="finish-button">
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
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepBack')}`);
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
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepBack')}`);
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
                onClick={() => {
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepForward')}`);
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
                  this.props.router.push(`${slug}/${mode}/${this.getStepParams(step, 'routerStepForward')}`);
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

export default withViewport(withRouter(OnboardingNavButtons));

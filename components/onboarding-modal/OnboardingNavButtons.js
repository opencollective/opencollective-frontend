import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';

import StyledRoundButton from '../../components/StyledRoundButton';
import StyledButton from '../../components/StyledButton';
import { Router } from '../../server/pages';

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
    submitCollectiveInfo: PropTypes.func,
    loading: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  setParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { step, slug, submitCollectiveInfo, loading } = this.props;

    return (
      <Flex>
        {step === 2 ? (
          <Fragment>
            <StyledRoundButton
              mr={3}
              size={48}
              disabled={this.setParams(step, 'disabled')}
              onClick={() => {
                Router.pushRoute('new-collective-onboarding-modal', {
                  slug,
                  step: this.setParams(step, 'routerStepBack'),
                });
              }}
            >
              ←
            </StyledRoundButton>
            <StyledButton buttonStyle="primary" onClick={submitCollectiveInfo} loading={loading}>
              Finish
            </StyledButton>
          </Fragment>
        ) : (
          <Fragment>
            <StyledRoundButton
              mr={3}
              size={48}
              disabled={this.setParams(step, 'disabled')}
              onClick={() => {
                Router.pushRoute('new-collective-onboarding-modal', {
                  slug,
                  step: this.setParams(step, 'routerStepBack'),
                });
              }}
            >
              ←
            </StyledRoundButton>
            <StyledRoundButton
              size={48}
              onClick={() => {
                Router.pushRoute('new-collective-onboarding-modal', {
                  slug,
                  step: this.setParams(step, 'routerStepForward'),
                });
              }}
            >
              →
            </StyledRoundButton>
          </Fragment>
        )}
      </Flex>
    );
  }
}

export default OnboardingNavButtons;

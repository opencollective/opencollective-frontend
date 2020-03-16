import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { Span } from '../Text';
import StepsProgress from '../StepsProgress';
import { Router } from '../../server/pages';

const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: 'Tiny',
  mt: 1,
};

const steps = [{ name: 'Welcome' }, { name: 'Administrators' }, { name: 'Contact' }];

const params = {
  0: {
    routerStep: undefined,
  },
  1: {
    routerStep: 'administrators',
  },
  2: {
    routerStep: 'contact',
  },
};

class OnboardingStepsProgress extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    slug: PropTypes.string,
  };

  setParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { slug } = this.props;

    return (
      <Fragment>
        <StepsProgress
          steps={steps}
          focus={steps[this.props.step]}
          onStepSelect={step => {
            const newStep = steps.findIndex(element => element.name === step.name);
            Router.pushRoute('new-collective-onboarding-modal', {
              slug,
              step: this.setParams(newStep, 'routerStep'),
            });
          }}
        >
          {({ step }) => {
            let label = null;
            if (step.name === 'Welcome') {
              label = <FormattedMessage id="welcome" defaultMessage="Welcome" />;
            }
            if (step.name === 'Administrators') {
              label = <FormattedMessage id="administrators" defaultMessage="Administrators" />;
            }
            if (step.name === 'Contact') {
              label = <FormattedMessage id="contact" defaultMessage="Contact" />;
            }
            return (
              <Flex flexDirection="column" alignItems="center">
                <StepLabel>{label}</StepLabel>
              </Flex>
            );
          }}
        </StepsProgress>
      </Fragment>
    );
  }
}

export default OnboardingStepsProgress;

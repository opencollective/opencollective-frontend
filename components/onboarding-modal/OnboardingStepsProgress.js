import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from '../Grid';
import StepsProgress from '../StepsProgress';
import { Span } from '../Text';

const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: '10px',
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
    mode: PropTypes.string,
    slug: PropTypes.string,
    router: PropTypes.object,
  };

  getStepParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { slug, mode } = this.props;

    return (
      <Fragment>
        <StepsProgress
          steps={steps}
          focus={steps[this.props.step]}
          onStepSelect={step => {
            const newStep = steps.findIndex(element => element.name === step.name);
            this.props.router.push(`/${slug}/${mode}/${this.getStepParams(newStep, 'routerStep')}`);
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
              label = <FormattedMessage id="Contact" defaultMessage="Contact" />;
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

export default withRouter(OnboardingStepsProgress);

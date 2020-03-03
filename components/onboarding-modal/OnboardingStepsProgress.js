import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';

import { H1, H3, Span, P } from '../Text';
import StepsProgress from '../StepsProgress';

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

class OnboardingStepsProgress extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      focus: steps[0],
      disabledStepNames: ['Administrators', 'Contact'],
    };
  }

  render() {
    const { query, collective } = this.props;
    const { focus, disabledStepNames } = this.state;

    return (
      <Fragment>
        <StepsProgress
          steps={steps}
          focus={focus}
          disabledStepNames={disabledStepNames}
          onStepSelect={focus => this.setState({ focus })}
        >
          {({ step }) => {
            return (
              <Flex flexDirection="column" alignItems="center">
                <StepLabel>{step.name}</StepLabel>
              </Flex>
            );
          }}
        </StepsProgress>
      </Fragment>
    );
  }
}

export default OnboardingStepsProgress;

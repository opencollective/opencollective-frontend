import React, { setState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';

import { H1, H3, Span, P } from '../../components/Text';
import StepsProgress from '../../components/StepsProgress';
import StyledHr from '../../components/StyledHr';
import StyledRoundButton from '../../components/StyledRoundButton';
import { Router } from '../../server/pages';
import Loading from '../../components/Loading';
import Container from '../../components/Container';
import OnboardingNavButtons from './OnboardingNavButtons';

const StepsProgressBox = styled(Box)`
  min-height: 95px;
  max-width: 600px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: 'Tiny',
  mt: 1,
};

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

const steps = [{ name: 'Welcome' }, { name: 'Administrators' }, { name: 'Contact' }];

class OnboardingModal extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      focus: steps[0],
      disabledStepNames: ['Administrators', 'Contact'],
      touchedStepNames: [],
      backButton: false,
    };
  }

  render() {
    const { query, collective } = this.props;
    const { focus, disabledStepNames, backButton, touchedStepNames } = this.state;

    console.log(this.state);

    return (
      <Flex flexDirection="column" alignItems="center" py={[5, 6]}>
        <StepsProgressBox mb={[3, null, 4]} width={0.8}>
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
        </StepsProgressBox>
        <Image src="/static/images/createcollective-anycommunity.png" alt="Welcome!" />
        <H3>The {collective.name} Collective has been created!</H3>
        <H3>🎉</H3>
        <StyledHr my={4} borderColor="black.300" width="100%" />
        <OnboardingNavButtons step={2} slug={collective.slug} />
      </Flex>
    );
  }
}

export default OnboardingModal;

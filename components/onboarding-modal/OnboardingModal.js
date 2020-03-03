import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';

import StyledHr from '../../components/StyledHr';
import OnboardingNavButtons from './OnboardingNavButtons';
import OnboardingStepsProgress from './OnboardingStepsProgress';
import OnboardingContentBox from './OnboardingContentBox';

const StepsProgressBox = styled(Box)`
  min-height: 95px;
  max-width: 600px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

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

class OnboardingModal extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.setStep = this.setStep.bind(this);

    this.state = {
      step: 0,
    };
  }

  componentDidMount() {
    this.setStep(this.props.query.step);
  }

  componentDidUpdate(oldProps) {
    if (oldProps.query.step !== this.props.query.step) {
      this.setStep(this.props.query.step);
    }
  }

  setStep = queryStep => {
    if (queryStep === undefined) {
      this.setState({ step: 0 });
    } else if (queryStep === 'administrators') {
      this.setState({ step: 1 });
    } else if (queryStep === 'contact') {
      this.setState({ step: 2 });
    }
  };

  render() {
    const { collective } = this.props;
    const { step } = this.state;

    return (
      <Flex flexDirection="column" alignItems="center" py={[4]}>
        <StepsProgressBox mb={[3, null, 4]} width={0.8}>
          <OnboardingStepsProgress step={step} handleStep={step => this.setState({ step })} slug={collective.slug} />
        </StepsProgressBox>
        <Image src="/static/images/createcollective-anycommunity.png" alt="Welcome!" />
        <OnboardingContentBox step={step} collective={collective} />
        <StyledHr my={4} borderColor="black.300" width="100%" />
        <OnboardingNavButtons step={step} slug={collective.slug} />
      </Flex>
    );
  }
}

export default OnboardingModal;

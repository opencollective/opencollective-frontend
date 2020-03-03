import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';

import Container from '../../components/Container';
import { H1, H3, Span, P } from '../../components/Text';
import { Router } from '../../server/pages';

const params = {
  0: {},
  1: {},
  2: {},
};

class OnboardingContentBox extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.setParams = this.setParams.bind(this);
  }

  setParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { step, collective } = this.props;

    return (
      <Container>
        {step === 0 && (
          <Fragment>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
            >
              The {collective.name} Collective has been created!
            </H1>
            <P fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']}>
              🎉
            </P>
          </Fragment>
        )}
        {step === 1 && (
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            Add administrators
          </H1>
        )}
        {step === 2 && (
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            Links and contact info
          </H1>
        )}
      </Container>
    );
  }
}

export default OnboardingContentBox;

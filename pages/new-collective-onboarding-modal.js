import React, { setState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { graphql } from 'react-apollo';
import { Box, Flex } from '@rebass/grid';

import ErrorPage from '../components/ErrorPage';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import Page from '../components/Page';
import { H1, H3, Span, P } from '../components/Text';
import StepsProgress from '../components/StepsProgress';
import StyledHr from '../components/StyledHr';
import StyledRoundButton from '../components/StyledRoundButton';
import { withUser } from '../components/UserProvider';
import { Router } from '../server/pages';

import Loading from '../components/Loading';
import Container from '../components/Container';
import { getCollectivePageQuery } from '../components/collective-page/graphql/queries';

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

class NewCollectiveOnboardingPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      slug: query && query.slug,
      query,
    };
  }

  static propTypes = {
    query: PropTypes.object,
    slug: PropTypes.string, // for addCollectiveCoverData
    data: PropTypes.object, // from withData
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
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
    const { data, LoggedInUser } = this.props;
    const { focus, disabledStepNames, backButton, touchedStepNames } = this.state;
    const collective = data && data.Collective;

    console.log(this.state);

    if (data.error) {
      return <ErrorPage data={data} />;
    }

    if (!LoggedInUser) {
      return (
        <Page>
          <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
            <Flex flexDirection="column" p={4} mt={2}>
              <Box mb={3}>
                <H1 fontSize="H3" lineHeight="H3" fontWeight="bold" textAlign="center">
                  Join Open Collective
                </H1>
              </Box>
              <Box textAlign="center">
                <P fontSize="Paragraph" color="black.600" mb={1}>
                  Create or sign in
                </P>
              </Box>
            </Flex>
            <SignInOrJoinFree />
          </Flex>
        </Page>
      );
    }

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    return (
      <Page>
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
          <Flex>
            <StyledRoundButton mr={3} disabled={!backButton} onClick={() => window && window.history.back()}>
              ←
            </StyledRoundButton>
            <StyledRoundButton
              onClick={() => {
                Router.pushRoute('new-collective-onboarding-modal', {
                  slug: collective.slug,
                  step: 'administrators',
                });
                this.setState({
                  focus: steps[1],
                  disabledStepNames: ['Contact'],
                  backButton: true,
                  touchedStepNames: ['Welcome', 'Administrators'],
                });
              }}
            >
              ->
            </StyledRoundButton>
          </Flex>
        </Flex>
      </Page>
    );
  }
}

const getCollective = graphql(getCollectivePageQuery, {
  options: props => ({
    variables: {
      slug: props.slug,
    },
  }),
});

export default withUser(getCollective(NewCollectiveOnboardingPage));

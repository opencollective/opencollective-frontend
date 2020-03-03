import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { Box, Flex } from '@rebass/grid';

import OnboardingModal from '../components/onboarding-modal/OnboardingModal';
import ErrorPage from '../components/ErrorPage';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import Page from '../components/Page';
import { H1, P } from '../components/Text';
import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import Container from '../components/Container';
import { getCollectivePageQuery } from '../components/collective-page/graphql/queries';

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
  }

  render() {
    const { data, LoggedInUser, query } = this.props;
    const collective = data && data.Collective;

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
        <Page>
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        </Page>
      );
    }

    if (data.error) {
      return <ErrorPage data={data} />;
    }

    return (
      <Page>
        <OnboardingModal query={query} collective={collective} />
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

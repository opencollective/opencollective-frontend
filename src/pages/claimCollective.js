import React, { Fragment } from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import fetch from 'node-fetch';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { formatCurrency } from '../lib/utils';
import { getBaseApiUrl } from '../lib/utils';
import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { H1, H2, P, Span } from '../components/Text';
import { Box, Flex } from 'grid-styled';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import StyledLink from '../components/StyledLink';
import Button from '../components/Button';

const WEBSITE_URL = process.env.WEBSITE_URL || 'https://opencollective.com';
const { API_KEY } = process.env;

class ClaimCollectivePage extends React.Component {
  static getInitialProps ({ query }) {
    return {
      slug: query && query.collectiveSlug,
      token: query && query.token,
    };
  }

  state = {
    error: null,
    loadingUserLogin: true,
    LoggedInUser: {},
    repos: [],
  }

  async componentDidMount() {
    const {
      getLoggedInUser,
      token,
    } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({
      LoggedInUser,
      loadingUserLogin: false,
    });

    const isConnected = token
      && LoggedInUser
      && LoggedInUser.collective
      && LoggedInUser.collective.connectedAccounts.some(({ service }) => service === 'github');
    if (isConnected) {
      const repos = await fetch(`${getBaseApiUrl()}/github-repositories?access_token=${token}`).then(response => response.json());
      this.setState({ repos });
    }
  }

  async claim(id) {
    try {
      const {
        data: {
          claimCollective: {
            slug,
          },
        },
      } = await this.props.claimCollective(id);
      Router.pushRoute(`/${slug}`);
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    const {
      data,
      slug,
      token,
    } = this.props;
    const {
      error,
      LoggedInUser,
      loadingUserLogin,
      repos,
    } = this.state;

    const {
      Collective: {
        currency,
        id,
        pledges,
        website,
      },
      loading,
    } = data;

    if (error) {
      data.error = data.error || error;
    }

    if (loading || error) {
      return <ErrorPage loading={loading} data={data} message={error && error.message} />;
    }

    const totalPledged = pledges.reduce((total, { totalAmount }) => total + totalAmount, 0);
    const connectUrl = `${getBaseApiUrl({ internal: true })}/connected-accounts/github?${API_KEY ? `api_key=${API_KEY}&` : ''}redirect=${WEBSITE_URL}/${slug}/claim`

    const [_, websitePath] = website.split(':');
    const [repo] = repos.filter(({ html_url }) => html_url.includes(websitePath));

    const isAdmin = (repo && repo.pemissions.admin) || true;

    return (
      <Fragment>
        <Header
          title={`Claim ${slug}`}
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <Container
            display="flex"
            flexDirection="column"
            alignItems="center"
            mx="auto"
            maxWidth={1200}
            py={4}
          >
            <H1>Claim {slug} Collective</H1>
            <Box my={3}>
              <P textAlign="center">
                <FormattedMessage
                  id="collective.pledges"
                  values={{
                    n: pledges.length,
                    total: formatCurrency(totalPledged, currency),
                  }}
                  defaultMessage={`{total} currently pledged to this collective from {n} {n, plural, one {supporter} other {supporters}}`}
                />
              </P>
            </Box>
          {!token && repos.length === 0 &&
            <StyledLink
              href={connectUrl}
              bg="#3385FF"
              borderRadius="50px"
              color="white"
              fontSize="1.6rem"
              fontWeight="bold"
              maxWidth="220px"
              hover={{ color: 'white' }}
              py={2}
              px={3}
              textAlign="center"
              width={1}
            >
              Connect to GitHub
            </StyledLink>
          }
          {repos.length > 0 && !isAdmin &&
            <P textAlign="center">
              You are not an admin of a repo matching {website}.
            </P>
          }
          {token && isAdmin &&
            <Fragment>
              <P textAlign="center" mb={2}>
                Congrats! You can now claim this collective. 👍
              </P>
              <Button className="blue" onClick={() => this.claim(id)}>Claim!</Button>
            </Fragment>
          }
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const addPledgesData = graphql(gql`
  query collectivePledges($slug: String) {
    Collective(slug: $slug) {
      currency
      id
      name
      website
      pledges: orders(status: PENDING) {
        totalAmount
      }
    }
  }
`);

const addClaimCollectiveMutation = graphql(gql`
  mutation claimCollective($id: Int!) {
    claimCollective(id: $id) {
      id
      slug
    }
  }`,
  {
    props: ( { mutate }) => ({
      claimCollective: (id) => mutate({ variables: { id } })
    })
  },
);

const addGraphQL = compose(
  addPledgesData,
  addClaimCollectiveMutation,
);

export { ClaimCollectivePage as MockClaimCollectivePage };
export default withData(withLoggedInUser(addGraphQL(withIntl(ClaimCollectivePage))));

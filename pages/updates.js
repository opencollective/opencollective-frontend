import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, omitBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL, getCollectivePageRoute } from '../lib/url-helpers';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import Loading from '../components/Loading';
import StyledButton from '../components/StyledButton';
import { H1, P } from '../components/Text';
import Updates from '../components/Updates';
import UpdateFilters from '../components/updates/UpdateFilters';
import { withUser } from '../components/UserProvider';

const ROUTE_PARAMS = ['collectiveSlug', 'offset'];

class UpdatesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, orderBy, searchTerm } }) {
    return { slug: collectiveSlug, orderBy, searchTerm };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveNavbarData
    LoggedInUser: PropTypes.object, // from withUser
    router: PropTypes.object, // from withRouter
    fetchMore: PropTypes.func, // from withData
    data: PropTypes.shape({
      account: PropTypes.object,
      loading: PropTypes.bool,
      refetch: PropTypes.func,
    }).isRequired, // from withData
  };

  componentDidMount() {
    const { router, data } = this.props;
    const account = data?.account;
    addParentToURLIfMissing(router, account, '/updates');
  }

  componentDidUpdate(prevProps) {
    const { data, LoggedInUser } = this.props;
    const collective = data.account;
    if (!prevProps.LoggedInUser && LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      // We refetch the data to get the updates that are not published yet
      data.refetch({ options: { fetchPolicy: 'network-only' } });
    }
  }

  updateQuery = (router, newParams) => {
    const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
    const pathname = router.asPath.split('?')[0];
    return router.push({ pathname, query });
  };

  render() {
    const { data, LoggedInUser, router } = this.props;

    if (!data.account) {
      return <ErrorPage data={data} />;
    }

    const collective = data.account;
    const updates = collective?.updates;
    return (
      <div className="UpdatesPage">
        <Header
          collective={collective}
          LoggedInUser={LoggedInUser}
          canonicalURL={`${getCollectivePageCanonicalURL(collective)}/updates`}
        />

        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
            selected={Sections.UPDATES}
            selectedCategory={NAVBAR_CATEGORIES.CONNECT}
          />

          <div className="content">
            <Flex flexWrap="wrap" alignItems="center" pr={2} justifyContent="space-between">
              <Container padding="0.8rem 0" my={4}>
                <H1 fontSize="40px" fontWeight="normal" textAlign="left" mb={2}>
                  <FormattedMessage id="updates" defaultMessage="Updates" />
                </H1>
                <P color="black.700" css={{ flex: '0 1 70%' }}>
                  <FormattedMessage
                    id="section.updates.subtitle"
                    defaultMessage="Updates on our activities and progress."
                  />
                </P>
              </Container>
              {LoggedInUser?.canEditCollective(collective) && (
                <Link href={`${getCollectivePageRoute(collective)}/updates/new`}>
                  <StyledButton buttonStyle="primary" m={2}>
                    <FormattedMessage id="sections.update.new" defaultMessage="Create an Update" />
                  </StyledButton>
                </Link>
              )}
            </Flex>
            <UpdateFilters
              values={router.query}
              onChange={queryParams =>
                this.updateQuery(router, {
                  ...queryParams,
                  offset: null,
                })
              }
            />
            <Box mt={4} mb={5}>
              {data.loading ? (
                <Loading />
              ) : (
                <Updates
                  collective={collective}
                  updates={updates}
                  fetchMore={this.props.fetchMore}
                  LoggedInUser={LoggedInUser}
                />
              )}
            </Box>
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export const updatesQuery = gqlV2/* GraphQL */ `
  query Updates(
    $collectiveSlug: String!
    $limit: Int
    $offset: Int
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
  ) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      name
      slug
      type
      ... on Event {
        parent {
          id
          slug
        }
      }
      ... on Project {
        parent {
          id
          slug
        }
      }
      features {
        ...NavbarFields
      }
      updates(limit: $limit, offset: $offset, searchTerm: $searchTerm, orderBy: $orderBy) {
        totalCount
        nodes {
          id
          slug
          title
          summary
          createdAt
          publishedAt
          updatedAt
          userCanSeeUpdate
          tags
          isPrivate
          isChangelog
          makePublicOn
          fromAccount {
            id
            type
            name
            slug
            imageUrl
          }
        }
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const getUpdatesVariables = (slug, orderBy = null, searchTerm = null) => {
  return {
    collectiveSlug: slug,
    offset: 0,
    limit: UPDATES_PER_PAGE * 2,
    orderBy: { field: 'CREATED_AT', direction: orderBy === 'oldest' ? 'ASC' : 'DESC' },
    searchTerm: searchTerm,
  };
};

export const UPDATES_PER_PAGE = 10;

const addUpdatesData = graphql(updatesQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: getUpdatesVariables(props.slug, props.orderBy, props.searchTerm),
  }),
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.account.updates.nodes.length,
          limit: UPDATES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          const previousResultNodes = Object.assign({}, previousResult.account.updates, {
            // Append the new posts results to the old one
            nodes: [...previousResult.account.updates.nodes, ...fetchMoreResult.account.updates.nodes],
          });

          const previousResultClone = cloneDeep(previousResult);
          previousResultClone.account.updates.nodes = previousResultNodes.nodes;
          return previousResultClone;
        },
      });
    },
  }),
});

export default withUser(withRouter(addUpdatesData(UpdatesPage)));

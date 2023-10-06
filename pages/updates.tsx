import React, { useEffect } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { cloneDeep, isEmpty, omitBy } from 'lodash';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { FEATURES, isFeatureSupported } from '../lib/allowed-features';
import { initClient } from '../lib/apollo-client';
import { shouldIndexAccountOnSearchEngines } from '../lib/collective.lib';
import { ERROR } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL, getCollectivePageRoute } from '../lib/url-helpers';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import Loading from '../components/Loading';
import Footer from '../components/navigation/Footer';
import StyledButton from '../components/StyledButton';
import { H1, P } from '../components/Text';
import Updates from '../components/Updates';
import UpdateFilters from '../components/updates/UpdateFilters';

const ROUTE_PARAMS = ['collectiveSlug', 'offset'];
export const UPDATES_PER_PAGE = 10;

export const updatesPageQuery = gql`
  query UpdatesPage(
    $collectiveSlug: String!
    $limit: Int
    $offset: Int
    $searchTerm: String
    $orderBy: UpdateChronologicalOrderInput
  ) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      legacyId
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
        id
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

const getPropsFromQuery = (query: Record<string, string>) => ({
  slug: query?.collectiveSlug,
  orderBy: query?.orderBy || null,
  searchTerm: query?.searchTerm || null,
});

export const getUpdatesVariables = (slug, orderBy = null, searchTerm = null) => {
  return {
    collectiveSlug: slug,
    offset: 0,
    limit: UPDATES_PER_PAGE * 2,
    orderBy: { field: 'PUBLISHED_AT', direction: orderBy === 'oldest' ? 'ASC' : 'DESC' },
    searchTerm: searchTerm,
  };
};

type UpdatesPageProps = {
  slug: string;
  orderBy?: string;
  searchTerm?: string;
  data: Partial<any>;
  error?: any;
};

export const getServerSideProps: GetServerSideProps<UpdatesPageProps> = async ctx => {
  const props = getPropsFromQuery(ctx.query as any);

  // Fetch data from GraphQL API for SSR
  const client = initClient();
  const { data, error } = await client.query({
    query: updatesPageQuery,
    variables: getUpdatesVariables(props.slug, props.orderBy, props.searchTerm),
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  return {
    props: {
      ...props,
      data,
      error: error || null,
    },
  };
};

export default function UpdatesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  // render() {
  const queryProps = getPropsFromQuery(router.query as any);
  const [fetchData, query] = useLazyQuery(updatesPageQuery, {
    variables: getUpdatesVariables(queryProps.slug, queryProps.orderBy, queryProps.searchTerm),
    context: API_V2_CONTEXT,
  });

  const error = query?.error || props.error;
  const data = query?.data || props.data;

  useEffect(() => {
    addParentToURLIfMissing(router, props?.data.account, '/updates');
  });

  useEffect(() => {
    if (LoggedInUser?.isAdminOfCollective?.(props.data.account)) {
      fetchData();
    }
  }, [LoggedInUser]);

  const updateQuery = (router, newParams) => {
    const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
    const pathname = router.asPath.split('?')[0];
    return router.push({ pathname, query });
  };

  const fetchMore = () => {
    if (!query.called) {
      return fetchData({
        variables: {
          ...query.variables,
          offset: 0,
          limit: data.account.updates.nodes.length + UPDATES_PER_PAGE,
        },
      });
    } else {
      return query.fetchMore({
        variables: {
          offset: data.account.updates.nodes.length,
          limit: UPDATES_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const data = isEmpty(previousResult) ? props.data : previousResult;
          if (!fetchMoreResult) {
            return data;
          }

          const result = cloneDeep(data);
          const updates = data.account?.updates;
          result.account.updates = {
            ...updates,
            nodes: [...updates.nodes, ...fetchMoreResult.account.updates.nodes],
          };
          return result;
        },
      });
    }
  };

  const isUpdatesSupported = isFeatureSupported(data.account, FEATURES.UPDATES);

  if (error) {
    return <ErrorPage error={error} />;
  } else if (!data.account) {
    return <ErrorPage data={data} />;
  } else if (!isUpdatesSupported) {
    return <ErrorPage error={{ type: ERROR.NOT_FOUND }} />;
  }

  const collective = data.account;
  const updates = collective?.updates;

  return (
    <div className="UpdatesPage">
      <Header
        collective={collective}
        loading={data.loading}
        LoggedInUser={LoggedInUser}
        canonicalURL={`${getCollectivePageCanonicalURL(collective)}/updates`}
        noRobots={!shouldIndexAccountOnSearchEngines(collective)}
      />

      <Body>
        <CollectiveNavbar
          collective={collective}
          isAdmin={LoggedInUser && LoggedInUser.isAdminOfCollective(collective)}
          selectedCategory={NAVBAR_CATEGORIES.CONNECT}
        />

        <div className="mx-auto max-w-[1260px] px-2 py-8 sm:px-4 sm:py-16 md:px-8">
          <Flex flexWrap="wrap" alignItems="center" pr={2} justifyContent="space-between">
            <Container padding="0.5rem 0" my={4}>
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
            {LoggedInUser?.isAdminOfCollective(collective) && (
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
              updateQuery(router, {
                ...queryParams,
                offset: null,
              })
            }
          />
          <Box mt={4} mb={5}>
            {data.loading ? (
              <Loading />
            ) : (
              <Updates collective={collective} updates={updates} fetchMore={fetchMore} LoggedInUser={LoggedInUser} />
            )}
          </Box>
        </div>
      </Body>

      <Footer />
    </div>
  );
}

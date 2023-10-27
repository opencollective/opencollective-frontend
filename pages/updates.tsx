import React, { useEffect } from 'react';
import { gql } from '@apollo/client';
import { cloneDeep, isEmpty, omitBy } from 'lodash';
import { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { FEATURES, isFeatureSupported } from '../lib/allowed-features';
import { getSSRQueryHelpers } from '../lib/apollo-client';
import { shouldIndexAccountOnSearchEngines } from '../lib/collective.lib';
import { ERROR } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL, getCollectivePageRoute } from '../lib/url-helpers';
import { NextParsedUrlQuery } from 'next/dist/server/request-meta';

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
          name
          slug
          imageUrl
        }
      }
      ... on Project {
        parent {
          id
          name
          slug
          imageUrl
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

const getPropsFromQuery = (query: NextParsedUrlQuery) => ({
  slug: query?.collectiveSlug as string,
  orderBy: (Array.isArray(query?.orderBy) ? query?.orderBy[0] : query?.orderBy) || null,
  searchTerm: (Array.isArray(query?.searchTerm) ? query?.searchTerm[0] : query?.searchTerm) || null,
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

const updatesPageQueryHelper = getSSRQueryHelpers<
  ReturnType<typeof getUpdatesVariables>,
  ReturnType<typeof getPropsFromQuery>
>({
  query: updatesPageQuery,
  context: API_V2_CONTEXT,
  getPropsFromContext: ctx => getPropsFromQuery(ctx.query),
  getVariablesFromContext: (ctx, props) => getUpdatesVariables(props.slug, props.orderBy, props.searchTerm),
});

export const getServerSideProps = updatesPageQueryHelper.getServerSideProps;

export default function UpdatesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const queryResult = updatesPageQueryHelper.useQuery(props);

  useEffect(() => {
    addParentToURLIfMissing(router, queryResult.data.account, '/updates');
  });

  useEffect(() => {
    if (LoggedInUser?.isAdminOfCollective?.(queryResult.data.account)) {
      queryResult.refetch();
    }
  }, [LoggedInUser]);

  const updateQuery = (router, newParams) => {
    const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
    const pathname = router.asPath.split('?')[0];
    return router.push({ pathname, query });
  };

  const fetchMore = () => {
    return queryResult.fetchMore({
      variables: {
        offset: queryResult.data.account.updates.nodes.length,
        limit: UPDATES_PER_PAGE,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const data = isEmpty(previousResult) ? queryResult.data : previousResult;
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
  };

  const isUpdatesSupported = isFeatureSupported(queryResult.data.account, FEATURES.UPDATES);

  if (queryResult.error) {
    return <ErrorPage error={queryResult.error} />;
  } else if (!queryResult.data.account) {
    return <ErrorPage data={queryResult.data} />;
  } else if (!isUpdatesSupported) {
    return <ErrorPage error={{ type: ERROR.NOT_FOUND }} />;
  }

  const collective = queryResult.data.account;
  const updates = collective?.updates;

  return (
    <div className="UpdatesPage">
      <Header
        collective={collective}
        loading={queryResult.loading}
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
            {queryResult.loading ? (
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

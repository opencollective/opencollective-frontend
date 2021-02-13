import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import { Box, Flex, Grid } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

import HostAdminCollectiveCard from './HostAdminCollectiveCard';
import HostAdminCollectiveFilters, { COLLECTIVE_FILTER } from './HostAdminCollectiveFilters';

const COLLECTIVES_PER_PAGE = 20;

// TODO: This query is using `legacyId` for host and member.account to interface with the
// legacy `AddFundsForm`. Once the new add funds form will be implemented, we can remove these fields.
const hostedCollectivesQuery = gqlV2/* GraphQL */ `
  query HostDashboardHostedCollectives(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: ChronologicalOrderInput!
    $hostFeesStructure: HostFeeStructure
    $searchTerm: String
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      type
      hostFeePercent
      plan {
        id
        hostFees
      }
      memberOf(
        role: HOST
        limit: $limit
        offset: $offset
        orderBy: $orderBy
        hostFeesStructure: $hostFeesStructure
        searchTerm: $searchTerm
        isApproved: true
      ) {
        offset
        limit
        totalCount
        nodes {
          id
          createdAt
          account {
            id
            legacyId
            name
            slug
            website
            type
            currency
            imageUrl(height: 96)
            tags
            settings
            createdAt
            stats {
              balance {
                valueInCents
              }
            }
            ... on AccountWithHost {
              hostFeesStructure
              hostFeePercent
            }
            ... on AccountWithContributions {
              totalFinancialContributors
            }
          }
        }
      }
    }
  }
`;

const checkIfQueryHasFilters = query =>
  Object.entries(query).some(([key, value]) => {
    return !['view', 'offset', 'limit', 'hostCollectiveSlug', 'sort-by'].includes(key) && value;
  });

const getVariablesFromQuery = query => {
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || COLLECTIVES_PER_PAGE,
    searchTerm: query.searchTerm,
    hostFeesStructure: query['fees-structure'],
    orderBy: {
      field: 'CREATED_AT',
      direction: query['sort-by'] === 'oldest' ? 'ASC' : 'DESC',
    },
  };
};

const HostDashboardHostedCollectives = ({ hostSlug }) => {
  const { query } = useRouter() || {};
  const hasFilters = React.useMemo(() => checkIfQueryHasFilters(query), [query]);
  const { data, error, loading, variables } = useQuery(hostedCollectivesQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
  });

  const hostedMemberships = data?.host?.memberOf;
  return (
    <Box maxWidth={1000} m="0 auto" px={2}>
      <Flex alignItems="center" mb={24} flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="HostedCollectives" defaultMessage="Hosted Collectives" />
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => Router.pushRoute('host.dashboard', { ...query, searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" />
      <Box mb={34}>
        {data?.host ? (
          <HostAdminCollectiveFilters
            values={query}
            filters={[COLLECTIVE_FILTER.SORT_BY, COLLECTIVE_FILTER.FEE_STRUCTURE]}
            onChange={queryParams =>
              Router.pushRoute('host.dashboard', {
                ...query,
                ...queryParams,
                offset: null,
              })
            }
          />
        ) : loading ? (
          <LoadingPlaceholder height={70} />
        ) : null}
      </Box>

      {error && <MessageBoxGraphqlError error={error} mb={2} />}

      {!error && !loading && !hostedMemberships?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-collective-message">
          {hasFilters ? (
            <FormattedMessage id="discover.searchNoResult" defaultMessage="No Collectives match the current search." />
          ) : (
            <FormattedMessage id="menu.collective.none" defaultMessage="No Collectives yet" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <Grid gridGap={24} gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))">
            {loading
              ? Array.from(new Array(COLLECTIVES_PER_PAGE)).map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <LoadingPlaceholder key={index} height={362} borderRadius="8px" />
                ))
              : hostedMemberships?.nodes.map(member => (
                  <HostAdminCollectiveCard
                    key={member.id}
                    host={data.host}
                    collective={member.account}
                    since={member.createdAt}
                  />
                ))}
          </Grid>
          <Flex mt={5} justifyContent="center">
            <Pagination
              route="host.dashboard"
              total={hostedMemberships?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              scrollToTopOnChange
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

HostDashboardHostedCollectives.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDashboardHostedCollectives;

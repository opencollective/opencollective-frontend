import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

import HostAdminCollectiveFilters, { COLLECTIVE_FILTER } from './HostAdminCollectiveFilters';
import PendingApplication, { processApplicationAccountFields } from './PendingApplication';

const COLLECTIVES_PER_PAGE = 20;

const pendingApplicationsQuery = gqlV2/* GraphQL */ `
  query HostDashboardPendingApplications(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: ChronologicalOrderInput!
    $searchTerm: String
  ) {
    host(slug: $hostSlug) {
      id
      slug
      name
      type
      settings
      pendingApplications(limit: $limit, offset: $offset, orderBy: $orderBy, searchTerm: $searchTerm) {
        offset
        limit
        totalCount
        nodes {
          id
          legacyId
          name
          slug
          website
          description
          type
          imageUrl(height: 96)
          createdAt
          ... on AccountWithHost {
            ...ProcessHostApplicationFields
          }
          admins: members(role: ADMIN) {
            totalCount
            nodes {
              id
              account {
                id
                type
                slug
                name
                imageUrl(height: 48)
              }
            }
          }
        }
      }
    }
  }
  ${processApplicationAccountFields}
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

const PendingApplications = ({ hostSlug }) => {
  const { query } = useRouter() || {};
  const hasFilters = React.useMemo(() => checkIfQueryHasFilters(query), [query]);
  const { data, error, loading, variables } = useQuery(pendingApplicationsQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
  });

  const hostApplications = data?.host?.pendingApplications;
  return (
    <Box maxWidth={1000} m="0 auto" px={2}>
      <Flex alignItems="center" mb={24} flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="host.dashboard.tab.pendingApplications" defaultMessage="Pending applications" />
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
            filters={[COLLECTIVE_FILTER.SORT_BY]}
            values={query}
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

      {!error && !loading && !hostApplications?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-collective-message">
          {hasFilters ? (
            <FormattedMessage id="discover.searchNoResult" defaultMessage="No collective matches the current search." />
          ) : (
            <FormattedMessage id="menu.collective.none" defaultMessage="No collectives yet" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          {loading
            ? Array.from(new Array(COLLECTIVES_PER_PAGE)).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box key={index} mb={24}>
                  <LoadingPlaceholder height={362} borderRadius="8px" />
                </Box>
              ))
            : hostApplications?.nodes.map(account => (
                <Box key={account.id} mb={24} data-cy="host-application">
                  <PendingApplication host={data.host} collective={account} />
                </Box>
              ))}
          <Flex mt={5} justifyContent="center">
            <Pagination
              route="host.dashboard"
              total={hostApplications?.totalCount}
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

PendingApplications.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default PendingApplications;

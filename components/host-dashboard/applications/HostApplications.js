import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import DashboardViews from '../../dashboard/DashboardViews';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import SearchBar from '../../SearchBar';
import { H1 } from '../../Text';
import HostAdminCollectiveFilters, { COLLECTIVE_FILTER } from '../HostAdminCollectiveFilters';

import HostApplication, { processApplicationAccountFields } from './HostApplication';

const COLLECTIVES_PER_PAGE = 20;

const hostApplicationsQuery = gql`
  query HostDashboardPendingApplications(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: ChronologicalOrderInput!
    $searchTerm: String
    $status: HostApplicationStatus
  ) {
    host(slug: $hostSlug) {
      id
      slug
      name
      type
      settings
      policies {
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
        }
      }
      hostApplications(limit: $limit, offset: $offset, orderBy: $orderBy, status: $status, searchTerm: $searchTerm) {
        offset
        limit
        totalCount
        nodes {
          id
          message
          customData
          status
          account {
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
            memberInvitations(role: [ADMIN]) {
              id
              role
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

      pending: hostApplications(limit: 0, offset: 0, status: PENDING) {
        totalCount
      }
      approved: hostApplications(limit: 0, offset: 0, status: APPROVED) {
        totalCount
      }
      rejected: hostApplications(limit: 0, offset: 0, status: REJECTED) {
        totalCount
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
    status: query.status,
    orderBy: {
      field: 'CREATED_AT',
      direction: query['sort-by'] === 'oldest' ? 'ASC' : 'DESC',
    },
  };
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'slug', 'section', 'view'];

const updateQuery = (router, newParams) => {
  const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  const pathname = router.asPath.split('?')[0];
  return router.push({ pathname, query });
};

const initViews = [
  {
    label: <FormattedMessage defaultMessage="Pending" />,
    query: {
      status: 'PENDING',
    },
    id: 'pending',
    showCount: true,
  },
  {
    label: <FormattedMessage defaultMessage="Approved" />,
    query: { status: 'APPROVED' },
    showCount: true,
    id: 'approved',
  },
  {
    label: <FormattedMessage defaultMessage="Rejected" />,
    query: { status: 'REJECTED' },
    showCount: true,
    id: 'rejected',
  },
];

const enforceDefaultParamsOnQuery = query => {
  return {
    ...query,
    status: query.status || 'PENDING',
  };
};

const HostApplications = ({ hostSlug, isDashboard }) => {
  const router = useRouter() || {};
  const query = enforceDefaultParamsOnQuery(router.query);
  const hasFilters = React.useMemo(() => checkIfQueryHasFilters(query), [query]);
  const vars = { hostSlug, ...getVariablesFromQuery(query) };
  const { data, error, loading, variables, refetch } = useQuery(hostApplicationsQuery, {
    variables: vars,
    context: API_V2_CONTEXT,
  });
  const pageRoute = isDashboard ? `/workspace/${hostSlug}/host-applications` : `/${hostSlug}/admin/host-applications`;

  const hostApplications = data?.host?.hostApplications;
  const [views, setViews] = React.useState(initViews);

  React.useEffect(() => {
    if (data) {
      setViews(
        initViews.map(view => {
          return {
            ...view,
            count: data.host[view.id]?.totalCount,
          };
        }),
      );
    }
  }, [data]);

  return (
    <Box maxWidth={1000} m="0 auto" px={2}>
      <Flex alignItems="center" mb={24} flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="HostDashboard.HostApplications" defaultMessage="Applications" />
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => updateQuery(router, { searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <DashboardViews
        query={query}
        omitMatchingParams={[...ROUTE_PARAMS, 'orderBy']}
        views={views}
        onChange={query => {
          router.push(
            {
              pathname: pageRoute,
              query,
            },
            undefined,
            { scroll: false },
          );
        }}
      />
      <Box mb={34}>
        {data?.host ? (
          <HostAdminCollectiveFilters
            filters={[COLLECTIVE_FILTER.SORT_BY]}
            values={query}
            onChange={queryParams =>
              updateQuery(router, {
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
            <FormattedMessage defaultMessage="No applications match the current filter." />
          ) : (
            <FormattedMessage defaultMessage="You have no applications." />
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
            : hostApplications?.nodes.map(application => (
                <Box key={application.id} mb={24} data-cy="host-application">
                  <HostApplication host={data.host} application={application} refetch={refetch} />
                </Box>
              ))}
          <Flex mt={5} justifyContent="center">
            <Pagination
              total={hostApplications?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

HostApplications.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  isDashboard: PropTypes.bool,
};

export default HostApplications;

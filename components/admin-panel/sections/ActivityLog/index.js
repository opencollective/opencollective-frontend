import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { parseDateInterval } from '../../../../lib/date-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import Container from '../../../Container';
import { Box } from '../../../Grid';
import Image from '../../../Image';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import StyledCard from '../../../StyledCard';
import StyledLink from '../../../StyledLink';

import ActivityFilters from './ActivityFilters';
import ActivityListItem from './ActivityListItem';
import { getActivityTypeFilterValuesFromKey, isSupportedActivityTypeFilter } from './ActivityTypeFilter';

const activityLogQuery = gql`
  query AccountActivityLog(
    $accountSlug: String!
    $limit: Int
    $offset: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $type: [ActivityAndClassesType!]
    $account: [AccountReferenceInput!]!
    $includeHostedAccounts: Boolean
    $includeChildrenAccounts: Boolean
    $excludeParentAccount: Boolean
  ) {
    account(slug: $accountSlug) {
      id
      name
      slug
      legacyId
      isHost
      type
      ... on Collective {
        childrenAccounts {
          totalCount
        }
      }
    }
    activities(
      account: $account
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      type: $type
      includeHostedAccounts: $includeHostedAccounts
      includeChildrenAccounts: $includeChildrenAccounts
      excludeParentAccount: $excludeParentAccount
    ) {
      offset
      limit
      totalCount
      nodes {
        id
        createdAt
        type
        data
        isSystem
        fromAccount {
          id
          name
          slug
        }
        account {
          id
          name
          slug
          ... on AccountWithParent {
            parent {
              id
              slug
            }
          }
        }
        expense {
          id
          legacyId
          description
          account {
            id
            name
            type
            slug
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        order {
          id
          legacyId
          description
          toAccount {
            id
            name
            slug
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        individual {
          id
          slug
          name
          type
          imageUrl(height: 48)
        }
      }
    }
  }
`;

const ActivityLogContainer = styled(StyledCard)`
  & > *:not(:last-child) {
    border-bottom: 1px solid #dcdde0;
  }

  a {
    color: black;
    text-decoration: underline dotted;
    &:hover {
      color: #4e5052;
    }
  }
`;

const ACTIVITY_LIMIT = 10;

const getQueryVariables = (accountSlug, router) => {
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { period, type, account } = routerQuery;
  const { from: dateFrom, to: dateTo } = parseDateInterval(period);

  // Account filters
  let filteredAccounts = { slug: accountSlug };
  let includeChildrenAccounts, includeHostedAccounts, excludeParentAccount;
  if (account === '__CHILDREN_ACCOUNTS__') {
    includeChildrenAccounts = true;
    excludeParentAccount = true;
  } else if (account === '__HOSTED_ACCOUNTS__') {
    includeHostedAccounts = true;
  } else if (account) {
    filteredAccounts = account.split(',').map(slug => ({ slug }));
    includeChildrenAccounts = true; // By default, we include children of selected accounts
  }

  return {
    accountSlug,
    dateFrom,
    dateTo,
    limit: ACTIVITY_LIMIT,
    offset,
    type: getActivityTypeFilterValuesFromKey(type),
    account: filteredAccounts,
    includeChildrenAccounts,
    excludeParentAccount,
    includeHostedAccounts,
  };
};

const getChangesThatRequireUpdate = (account, queryParams) => {
  const changes = {};
  if (!account) {
    return changes;
  }

  if (!isSupportedActivityTypeFilter(account, queryParams.type)) {
    changes.type = null;
  }
  return changes;
};

const ActivityLog = ({ accountSlug }) => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: getQueryVariables(accountSlug, router),
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
  });

  const handleUpdateFilters = queryParams => {
    const pathname = router.asPath.split('?')[0];
    return router.push({
      pathname,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  };

  // Reset type if not supported by the account
  React.useEffect(() => {
    const changesThatRequireUpdate = getChangesThatRequireUpdate(data?.account, routerQuery);
    if (!isEmpty(changesThatRequireUpdate)) {
      handleUpdateFilters({ ...routerQuery, ...changesThatRequireUpdate });
    }
  }, [data?.account, routerQuery]);

  return (
    <Box mt={3}>
      <ActivityFilters
        filters={routerQuery}
        onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
        account={data?.account}
      />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : loading ? (
        <LoadingPlaceholder width="100%" height={163} />
      ) : !data?.activities?.nodes ? (
        <MessageBox type="error" withIcon title="You must be admin">
          <FormattedMessage
            id="mustBeAdmin"
            defaultMessage="You must be an admin of this collective to see this page"
          />
        </MessageBox>
      ) : (
        <React.Fragment>
          {!data.activities.totalCount ? (
            <MessageBox type="info" withIcon>
              <FormattedMessage defaultMessage="No activity yet" />
            </MessageBox>
          ) : (
            <ActivityLogContainer>
              {data.activities.nodes.map(activity => (
                <ActivityListItem key={activity.id} activity={activity} />
              ))}
            </ActivityLogContainer>
          )}
        </React.Fragment>
      )}
      {data?.activities?.totalCount > ACTIVITY_LIMIT && (
        <Container display="flex" justifyContent="center" fontSize="14px" my={3}>
          <Pagination
            offset={offset}
            total={data.activities.totalCount}
            limit={ACTIVITY_LIMIT}
            ignoredQueryParams={['slug', 'section']}
          />
        </Container>
      )}
    </Box>
  );
};

ActivityLog.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default ActivityLog;

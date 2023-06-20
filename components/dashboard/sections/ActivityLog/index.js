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
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import StyledCard from '../../../StyledCard';
import { cx } from 'class-variance-authority';
import ActivityFilters from './ActivityFilters';
import ActivityListItem from './ActivityListItem';
import { isSupportedActivityTypeFilter } from './ActivityTypeFilter';

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
          type
        }
        host {
          id
          name
          slug
          type
        }
        account {
          id
          name
          slug
          type
          ... on AccountWithParent {
            parent {
              id
              slug
              name
              type
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
const typesToInclude = [
  // 'CONNECTED_ACCOUNT_CREATED',
  // 'CONNECTED_ACCOUNT_ERROR',
  // 'COLLECTIVE_CREATED_GITHUB',
  // 'COLLECTIVE_APPLY',
  // 'COLLECTIVE_APPROVED',
  // 'COLLECTIVE_REJECTED',
  // 'COLLECTIVE_CREATED',
  // 'COLLECTIVE_EDITED',
  // 'COLLECTIVE_DELETED',
  // 'COLLECTIVE_UNHOSTED',
  // 'ORGANIZATION_COLLECTIVE_CREATED',
  // 'COLLECTIVE_FROZEN',
  // 'COLLECTIVE_UNFROZEN',
  // 'COLLECTIVE_CONVERSATION_CREATED',
  // 'UPDATE_COMMENT_CREATED',
  // 'EXPENSE_COMMENT_CREATED',
  // 'CONVERSATION_COMMENT_CREATED',
  'COLLECTIVE_EXPENSE_CREATED',
  'COLLECTIVE_EXPENSE_DELETED',
  'COLLECTIVE_EXPENSE_UPDATED',
  'COLLECTIVE_EXPENSE_REJECTED',
  'COLLECTIVE_EXPENSE_APPROVED',
  'COLLECTIVE_EXPENSE_RE_APPROVAL_REQUESTED',
  'COLLECTIVE_EXPENSE_UNAPPROVED',
  'COLLECTIVE_EXPENSE_MOVED',
  'COLLECTIVE_EXPENSE_PAID',
  'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  'COLLECTIVE_EXPENSE_PROCESSING',
  'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  'COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT',
  'COLLECTIVE_EXPENSE_ERROR',
  'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  // 'TAXFORM_REQUEST',
  // 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  // 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  // 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  // 'COLLECTIVE_VIRTUAL_CARD_DELETED',
  // 'VIRTUAL_CARD_REQUESTED',
  // 'VIRTUAL_CARD_CHARGE_DECLINED',
  // 'VIRTUAL_CARD_PURCHASE',
  // 'COLLECTIVE_MEMBER_INVITED',
  // 'COLLECTIVE_MEMBER_CREATED',
  // 'COLLECTIVE_CORE_MEMBER_ADDED',
  // 'COLLECTIVE_CORE_MEMBER_INVITED',
  // 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  // 'COLLECTIVE_CORE_MEMBER_REMOVED',
  // 'COLLECTIVE_CORE_MEMBER_EDITED',
  // 'COLLECTIVE_TRANSACTION_CREATED',
  // 'COLLECTIVE_UPDATE_CREATED',
  // 'COLLECTIVE_UPDATE_PUBLISHED',
  // 'COLLECTIVE_CONTACT',
  // 'HOST_APPLICATION_CONTACT',
  // 'CONTRIBUTION_REJECTED',
  // 'SUBSCRIPTION_ACTIVATED',
  // 'SUBSCRIPTION_CANCELED',
  // 'TICKET_CONFIRMED',
  // 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  // 'ORDER_PENDING',
  // 'ORDER_PENDING_CRYPTO',
  // 'ORDER_PENDING_CONTRIBUTION_NEW',
  // 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  // 'ORDER_PROCESSING',
  // 'ORDER_PAYMENT_FAILED',
  // 'ORDER_THANKYOU',
  // 'ORDER_PENDING_CREATED',
  // 'ORDER_PENDING_FOLLOWUP',
  // 'ORDER_PENDING_RECEIVED',
  // 'ORDERS_SUSPICIOUS',
  // 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  // 'PAYMENT_FAILED',
  // 'PAYMENT_CREDITCARD_CONFIRMATION',
  // 'PAYMENT_CREDITCARD_EXPIRING',
  // 'USER_CREATED',
  // "USER_NEW_TOKEN",
  // "USER_SIGNIN",
  // 'USER_RESET_PASSWORD',
  // 'OAUTH_APPLICATION_AUTHORIZED',
  // "TWO_FACTOR_CODE_ADDED",
  // "TWO_FACTOR_CODE_DELETED",
  // 'USER_CHANGE_EMAIL',
  // 'USER_PAYMENT_METHOD_CREATED',
  // 'USER_PASSWORD_SET',
  // 'USER_CARD_CLAIMED',
  // 'USER_CARD_INVITED',
  // 'WEBHOOK_STRIPE_RECEIVED',
  // 'WEBHOOK_PAYPAL_RECEIVED',
  // 'COLLECTIVE_MONTHLY_REPORT',
  // 'ACTIVATED_COLLECTIVE_AS_HOST',
  // 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  // 'DEACTIVATED_COLLECTIVE_AS_HOST',
  // 'ADDED_FUND_TO_ORG',
  // 'COLLECTIVE_TRANSACTION_PAID',
  // 'COLLECTIVE_USER_ADDED',
  // 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  // 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  // 'SUBSCRIPTION_CONFIRMED',
  // 'COLLECTIVE_COMMENT_CREATED',
  // 'COLLECTIVE',
  // 'EXPENSES',
  // 'CONTRIBUTIONS',
  // 'ACTIVITIES_UPDATES',
  // 'VIRTUAL_CARDS',
  // 'FUND_EVENTS',
  // 'REPORTS',
];
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

const stats = [
  { name: 'Paypal balance', value: '$125,091.00', refill: true },
  { name: 'Wise balance', value: '$12,787.00', refill: true },
  { name: 'Issuing balance', value: '$137,878.00', refill: true },
];

const ACTIVITY_LIMIT = 20;

const getQueryVariables = (accountSlug, router) => {
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { period, type, account, limit } = routerQuery;
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
    limit: limit ? parseInt(limit) : ACTIVITY_LIMIT,
    offset,
    type: typesToInclude,
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

const ActivityLog = ({ account }) => {
  console.log({ accountInLog: account });
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: getQueryVariables(account.slug, router),
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
    <div className="max-w-screen-lg">
      {account.isHost && (
        <div className="mb-6 border rounded-lg border-gray-900/10">
          <dl className=" grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:px-2 xl:px-0">
            {stats.map((stat, statIdx) => (
              <div
                key={stat.name}
                className={cx(
                  statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                  'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-gray-900/5 px-4 py-10 sm:px-6 lg:border-t-0 xl:px-8',
                )}
              >
                <dt className="text-sm font-medium leading-6 text-gray-500">{stat.name}</dt>
                {stat.refill ? <dd className={'text-blue-600 text-xs font-medium'}>Refill</dd> : null}
                <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <h1 className="mb-10 text-2xl font-bold tracking-tight text-gray-900">Recent activity</h1>

      {/* <ActivityFilters
        filters={routerQuery}
        onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
        account={data?.account}
      /> */}
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : loading ? (
        <LoadingPlaceholder width="100%" height={163} />
      ) : !data?.activities?.nodes ? (
        <MessageBox type="error" withIcon>
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
            <div className="mb-20 space-y-10">
              {data.activities.nodes.map(activity => (
                <ActivityListItem key={activity.id} activity={activity} />
              ))}
            </div>
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
    </div>
  );
};

ActivityLog.propTypes = {
  account: PropTypes.object,
};

export default ActivityLog;

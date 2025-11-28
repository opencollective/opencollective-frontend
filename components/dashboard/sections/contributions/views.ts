import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import type { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/schema';

import type { FilterValues } from './filters';

/**
 * Views used by IncomingContributions and OutgoingContributions
 */
export enum OrderTabs {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
}

const incomingOutgoingContributionViewCountsQuery = gql`
  query IncomingOutgoingContributionViewCounts($slug: String!, $filter: AccountOrdersFilter!) {
    account(slug: $slug) {
      id

      RECURRING: orders(
        filter: $filter
        frequency: [MONTHLY, YEARLY]
        status: [ACTIVE, ERROR]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      ONETIME: orders(
        filter: $filter
        frequency: [ONETIME]
        status: [PAID, PROCESSING]
        includeIncognito: true
        includeChildrenAccounts: true
        minAmount: 1
      ) {
        totalCount
      }
      CANCELED: orders(filter: $filter, status: [CANCELLED], includeIncognito: true, includeChildrenAccounts: true) {
        totalCount
      }
      PAUSED: orders(filter: $filter, status: [PAUSED], includeIncognito: true, includeChildrenAccounts: true) {
        totalCount
      }
    }
  }
`;

interface UseContributionFlowViewsResult {
  views: Views<FilterValues>;
  loading: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch contribution flow metadata and return views with counts
 */
export function useContributionFlowViews(
  slug: string,
  direction: 'INCOMING' | 'OUTGOING',
): UseContributionFlowViewsResult {
  const intl = useIntl();

  const { data, loading, refetch } = useQuery(incomingOutgoingContributionViewCountsQuery, {
    variables: { slug, filter: direction },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });
  const views = [
    {
      id: OrderTabs.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      count: data?.account?.[OrderTabs.ALL]?.totalCount,
    },
    {
      id: OrderTabs.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
      filter: {
        frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
        status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
      },
      count: data?.account?.[OrderTabs.RECURRING]?.totalCount,
    },
    {
      id: OrderTabs.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
      filter: {
        frequency: [ContributionFrequency.ONETIME],
        status: [OrderStatus.PAID, OrderStatus.PROCESSING],
      },
      count: data?.account?.[OrderTabs.ONETIME]?.totalCount,
    },
    {
      id: OrderTabs.PAUSED,
      label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
      count: data?.account?.[OrderTabs.PAUSED]?.totalCount,
    },
    {
      id: OrderTabs.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
      count: data?.account?.[OrderTabs.CANCELED]?.totalCount,
    },
  ];

  return {
    views,
    loading,
    refetch,
  };
}

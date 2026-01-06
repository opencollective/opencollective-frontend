import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import type { Views } from '../../../../lib/filters/filter-types';
import { gql } from '../../../../lib/graphql/helpers';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/schema';

import type { FilterValues } from './filters';

/**
 * Views used by IncomingContributions and OutgoingContributions
 */
enum IncomingOutgoingContributionTabs {
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
 * Hook to fetch views and their counts for incoming/outgoing contributions
 */
export function useIncomingOutgoingContributionViews(
  slug: string,
  direction: 'INCOMING' | 'OUTGOING',
): UseContributionFlowViewsResult {
  const intl = useIntl();

  const { data, loading, refetch } = useQuery(incomingOutgoingContributionViewCountsQuery, {
    variables: { slug, filter: direction },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });
  const views = [
    {
      id: IncomingOutgoingContributionTabs.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      count: data?.account?.[IncomingOutgoingContributionTabs.ALL]?.totalCount,
    },
    {
      id: IncomingOutgoingContributionTabs.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
      filter: {
        frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
        status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
      },
      count: data?.account?.[IncomingOutgoingContributionTabs.RECURRING]?.totalCount,
    },
    {
      id: IncomingOutgoingContributionTabs.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
      filter: {
        frequency: [ContributionFrequency.ONETIME],
        status: [OrderStatus.PAID, OrderStatus.PROCESSING],
      },
      count: data?.account?.[IncomingOutgoingContributionTabs.ONETIME]?.totalCount,
    },
    {
      id: IncomingOutgoingContributionTabs.PAUSED,
      label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
      count: data?.account?.[IncomingOutgoingContributionTabs.PAUSED]?.totalCount,
    },
    {
      id: IncomingOutgoingContributionTabs.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
      count: data?.account?.[IncomingOutgoingContributionTabs.CANCELED]?.totalCount,
    },
  ];

  return {
    views,
    loading,
    refetch,
  };
}

import { useQuery } from '@apollo/client';
import type { IntlShape } from 'react-intl';

import type { Views } from '../../../../lib/filters/filter-types';
import { gql } from '../../../../lib/graphql/helpers';
import type { OppositeAccountScope} from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import type { AccountOrdersFilter, HostContext } from '@/lib/graphql/types/v2/schema';

import type { FilterValues } from './filters';

/**
 * View IDs used by IncomingContributions and OutgoingContributions
 */
enum IncomingOutgoingContributionTabs {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
}

const incomingOutgoingContributionViewCountsQuery = gql`
  query IncomingOutgoingContributionViewCounts(
    $slug: String!
    $hostContext: HostContext
    $filter: AccountOrdersFilter!
    $oppositeAccountScope: OppositeAccountScope
  ) {
    account(slug: $slug) {
      id

      ALL: orders(
        hostContext: $hostContext
        filter: $filter
        oppositeAccountScope: $oppositeAccountScope
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      RECURRING: orders(
        hostContext: $hostContext
        filter: $filter
        oppositeAccountScope: $oppositeAccountScope
        frequency: [MONTHLY, YEARLY]
        status: [ACTIVE, PROCESSING, ERROR]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      ONETIME: orders(
        hostContext: $hostContext
        filter: $filter
        oppositeAccountScope: $oppositeAccountScope
        frequency: [ONETIME]
        status: [PAID, PROCESSING]
        includeIncognito: true
        includeChildrenAccounts: true
        minAmount: 1
      ) {
        totalCount
      }
      CANCELED: orders(
        hostContext: $hostContext
        filter: $filter
        oppositeAccountScope: $oppositeAccountScope
        status: [CANCELLED]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      PAUSED: orders(
        hostContext: $hostContext
        filter: $filter
        oppositeAccountScope: $oppositeAccountScope
        status: [PAUSED]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
    }
  }
`;

/**
 * View definitions (id, label, filter) without counts. Use this for queryFilter so that
 * view structure does not depend on the count query. Pass the result to useQueryFilter,
 * then use useIncomingOutgoingContributionViews with queryFilter-derived vars to get
 * viewCounts and merge for display.
 */
export function getContributionViews(intl: IntlShape): Views<FilterValues> {
  return [
    {
      id: IncomingOutgoingContributionTabs.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: IncomingOutgoingContributionTabs.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
      filter: {
        frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
        status: [OrderStatus.ACTIVE, OrderStatus.PROCESSING, OrderStatus.ERROR],
      },
    },
    {
      id: IncomingOutgoingContributionTabs.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
      filter: {
        frequency: [ContributionFrequency.ONETIME],
        status: [OrderStatus.PAID, OrderStatus.PROCESSING],
      },
    },
    {
      id: IncomingOutgoingContributionTabs.PAUSED,
      label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
    },
    {
      id: IncomingOutgoingContributionTabs.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
    },
  ];
}

type IncomingOutgoingContributionViewCounts = Partial<Record<IncomingOutgoingContributionTabs, number>>;

interface UseIncomingOutgoingContributionViewCountsResult {
  viewCounts: IncomingOutgoingContributionViewCounts;
  loading: boolean;
  refetch: () => void;
}

/**
 * Fetches view counts for incoming/outgoing contributions. Depends on slug, hostContext, and filter
 * (e.g. from queryFilter). Use with getIncomingOutgoingContributionViews: pass views to
 * useQueryFilter, then call this hook with the same vars you use for the main query, and merge
 * viewCounts onto views for display.
 */
export function useFetchContributionViewCounts({
  slug,
  hostContext,
  filter,
  oppositeAccountScope,
}: {
  slug: string;
  hostContext?: HostContext;
  filter: AccountOrdersFilter;
  oppositeAccountScope?: OppositeAccountScope;
}): UseIncomingOutgoingContributionViewCountsResult {
  const { data, loading, refetch } = useQuery(incomingOutgoingContributionViewCountsQuery, {
    variables: { slug, hostContext, filter, oppositeAccountScope },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const account = data?.account;
  const viewCounts: IncomingOutgoingContributionViewCounts = {
    [IncomingOutgoingContributionTabs.ALL]: account?.ALL?.totalCount,
    [IncomingOutgoingContributionTabs.RECURRING]: account?.RECURRING?.totalCount,
    [IncomingOutgoingContributionTabs.ONETIME]: account?.ONETIME?.totalCount,
    [IncomingOutgoingContributionTabs.PAUSED]: account?.PAUSED?.totalCount,
    [IncomingOutgoingContributionTabs.CANCELED]: account?.CANCELED?.totalCount,
  };

  return {
    viewCounts,
    loading,
    refetch,
  };
}

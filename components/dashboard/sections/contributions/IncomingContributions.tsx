import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { Account, DashboardOrdersQueryVariables } from '@/lib/graphql/types/v2/graphql';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import { tierFilter } from '../../filters/TierFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import type { FilterMeta as BaseFilterMeta } from './filters';
import {
  filters as baseFilters,
  ContributionAccountingCategoryKinds,
  schema as baseSchema,
  toVariables as baseToVariables,
} from './filters';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';
import { dashboardOrdersQuery } from './queries';

enum ContributionsTab {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
}

const incomingContributionsMetadataQuery = gql`
  query IncomingContributionsMetadata($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      type
      settings
      imageUrl
      currency
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          type
        }
      }
      RECURRING: orders(
        filter: INCOMING
        frequency: [MONTHLY, YEARLY]
        status: [ACTIVE, ERROR]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      ONETIME: orders(
        filter: INCOMING
        frequency: [ONETIME]
        status: [PAID, PROCESSING]
        includeIncognito: true
        includeChildrenAccounts: true
        minAmount: 1
      ) {
        totalCount
      }
      CANCELED: orders(filter: INCOMING, status: [CANCELLED], includeIncognito: true, includeChildrenAccounts: true) {
        totalCount
      }
      PAUSED: orders(filter: INCOMING, status: [PAUSED], includeIncognito: true, includeChildrenAccounts: true) {
        totalCount
      }
      PAUSED_RESUMABLE: orders(
        filter: INCOMING
        status: [PAUSED]
        includeIncognito: true
        includeChildrenAccounts: true
        pausedBy: [COLLECTIVE, HOST, PLATFORM]
      ) {
        totalCount
      }
    }
  }
`;
const schema = baseSchema.extend({ tier: tierFilter.schema, account: childAccountFilter.schema });

type FilterValues = z.infer<typeof schema>;
type FilterMeta = BaseFilterMeta & {
  childrenAccounts?: Account[];
};

const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...baseToVariables,
  tier: tierFilter.toVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenAccounts: false };
    } else if (!value) {
      return { includeChildrenAccounts: true };
    } else {
      return { slug: value, includeChildrenAccounts: false };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...baseFilters,
  tier: tierFilter.filter,
  account: childAccountFilter.filter,
};

const IncomingContributions = ({ accountSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: ContributionsTab.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
      filter: {
        frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
        status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
      },
    },
    {
      id: ContributionsTab.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
      filter: {
        frequency: [ContributionFrequency.ONETIME],
        status: [OrderStatus.PAID, OrderStatus.PROCESSING],
      },
    },
    {
      id: ContributionsTab.PAUSED,
      label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
    },
    {
      id: ContributionsTab.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
    },
  ];

  const filterMeta: FilterMeta = {
    currency: account?.currency,
    accountSlug: account?.slug,
    childrenAccounts: account?.childrenAccounts?.nodes ?? [],
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    filters,
  });

  const {
    data: metadata,
    loading: metadataLoading,
    refetch: refetchMetadata,
  } = useQuery(incomingContributionsMetadataQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      includeIncognito: true,
      includeChildrenAccounts: true,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    refetchMetadata();
  }, [refetch, refetchMetadata]);

  const viewsWithCount = views.map(view => ({
    ...view,
    count: metadata?.account?.[view.id]?.totalCount,
  }));

  const currentViewCount = viewsWithCount.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  const showPausedMessage =
    !metadataLoading &&
    metadata?.account?.canStartResumeContributionsProcess &&
    metadata?.account?.PAUSED_RESUMABLE?.totalCount > 0 &&
    !metadata?.account?.parent;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />}
        description={
          <FormattedMessage id="IncomingContributions.description" defaultMessage="Contributions to your account." />
        }
      />

      {showPausedMessage && (
        <PausedIncomingContributionsMessage
          account={metadata.account}
          count={metadata.account[ContributionsTab.PAUSED].totalCount}
        />
      )}

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        views={viewsWithCount}
        orders={orders}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        error={error}
        refetch={handleRefetch}
      />
    </div>
  );
};

export default IncomingContributions;

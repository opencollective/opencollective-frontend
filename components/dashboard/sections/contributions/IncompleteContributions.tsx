import React, { useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExpectedFundsFilter, OrderStatus } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { HostContextFilter, hostContextFilter } from '../../filters/HostContextFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import type { FilterMeta } from './filters';
import { ContributionAccountingCategoryKinds, filters, schema as baseSchema, toVariables } from './filters';
import { dashboardOrdersQuery } from './queries';

const schema = baseSchema.extend({
  hostContext: hostContextFilter.schema,
});

enum IncompleteContributionsView {
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  PAID = 'PAID',
}

const incompleteContributionsMetadataQuery = gql`
  query IncompleteContributionsMetadata($slug: String!, $hostContext: HostContext) {
    account(slug: $slug) {
      id
      slug

      PENDING: orders(
        filter: INCOMING
        status: [PENDING]
        includeIncognito: true
        hostContext: $hostContext
        expectedFundsFilter: ONLY_MANUAL
      ) {
        totalCount
      }
      EXPIRED: orders(
        filter: INCOMING
        status: [EXPIRED]
        includeIncognito: true
        hostContext: $hostContext
        expectedFundsFilter: ONLY_MANUAL
      ) {
        totalCount
      }
      PAID: orders(
        filter: INCOMING
        status: [PAID]
        includeIncognito: true
        hostContext: $hostContext
        expectedFundsFilter: ONLY_MANUAL
      ) {
        totalCount
      }
    }
  }
`;

export default function IncompleteContributions({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const filterMeta: FilterMeta = {
    currency: account.currency,
    accountSlug: account.slug,
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
  };

  const views = [
    {
      id: IncompleteContributionsView.PENDING,
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: {
        status: [OrderStatus.PENDING],
      },
    },
    {
      id: IncompleteContributionsView.EXPIRED,
      label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
      filter: {
        status: [OrderStatus.EXPIRED],
      },
    },
    {
      id: IncompleteContributionsView.PAID,
      label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
      filter: {
        status: [OrderStatus.PAID],
      },
    },
  ];

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    filters,
    views,
    skipFiltersOnReset: ['hostContext'],
    lockViewFilters: true,
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      includeIncognito: true,
      expectedFundsFilter: ExpectedFundsFilter.ONLY_MANUAL,
      ...queryFilter.variables,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data: metadata, refetch: refetchMetadata } = useQuery(incompleteContributionsMetadataQuery, {
    variables: {
      slug: accountSlug,
      hostContext: account.hasHosting ? queryFilter.values.hostContext : undefined,
    },

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

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage id="IncompleteContributions" defaultMessage="Incomplete Contributions" />
            {account.hasHosting && (
              <HostContextFilter
                value={queryFilter.values.hostContext}
                onChange={val => queryFilter.setFilter('hostContext', val)}
                intl={intl}
              />
            )}
          </div>
        }
        description={
          <FormattedMessage
            defaultMessage="Contributions with a manual payment that have not been reconciled."
            id="NOpFmL"
          />
        }
      />

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        views={viewsWithCount}
        orders={orders}
        loading={loading}
        nbPlaceholders={queryFilter.values.limit}
        error={error}
        refetch={handleRefetch}
        columnVisibility={{ lastChargedAt: false, createdAt: true, expectedAt: false }}
      />
    </div>
  );
}

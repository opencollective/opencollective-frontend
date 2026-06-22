import React from 'react';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import type { FiltersToVariables, Views } from '@/lib/filters/filter-types';
import { gql } from '@/lib/graphql/helpers';
import type { DashboardOrdersQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { ExpectedFundsFilter, OrderStatus } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { expectedDateFilter } from '@/components/dashboard/filters/DateFilter';
import ContributionsTable from '@/components/dashboard/sections/contributions/ContributionsTable';
import type { FilterMeta } from '@/components/dashboard/sections/contributions/filters';
import {
  ContributionAccountingCategoryKinds,
  filters as baseFilters,
  schema as baseSchema,
  toVariables as baseToVariables,
} from '@/components/dashboard/sections/contributions/filters';
import { dashboardOrdersQuery } from '@/components/dashboard/sections/contributions/queries';

import type { HostedAccountProfileData } from './types';

const schema = baseSchema.extend({
  expectedDate: expectedDateFilter.schema,
  expectedFundsFilter: z.literal(ExpectedFundsFilter.ONLY_PENDING).default(ExpectedFundsFilter.ONLY_PENDING),
});

type FilterValues = z.infer<typeof schema>;

const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...(baseToVariables as FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta>),
  expectedDate: expectedDateFilter.toVariables,
};

const filters = {
  ...baseFilters,
  expectedDate: expectedDateFilter.filter,
};

const expectedFundsMetadataQuery = gql`
  query HostedAccountExpectedFundsMetadata($slug: String!) {
    account(slug: $slug) {
      id
      PENDING: orders(
        filter: INCOMING
        expectedFundsFilter: ONLY_PENDING
        status: [PENDING]
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      PAID: orders(
        filter: INCOMING
        expectedFundsFilter: ONLY_PENDING
        status: [PAID]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      EXPIRED: orders(
        filter: INCOMING
        expectedFundsFilter: ONLY_PENDING
        status: [EXPIRED]
        includeChildrenAccounts: true
      ) {
        totalCount
      }
      CANCELED: orders(
        filter: INCOMING
        expectedFundsFilter: ONLY_PENDING
        status: [CANCELLED]
        includeIncognito: true
        includeChildrenAccounts: true
      ) {
        totalCount
      }
    }
  }
`;

type HostedAccountExpectedFundsTabProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
};

export function HostedAccountExpectedFundsTab({ account, hostSlug }: HostedAccountExpectedFundsTabProps) {
  const intl = useIntl();

  const views: Views<FilterValues> = [
    { id: 'ALL', label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }), filter: {} },
    {
      id: 'PENDING',
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: { status: [OrderStatus.PENDING] },
    },
    {
      id: 'PAID',
      label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
      filter: { status: [OrderStatus.PAID] },
    },
    {
      id: 'EXPIRED',
      label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
      filter: { status: [OrderStatus.EXPIRED] },
    },
    {
      id: 'CANCELED',
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: { status: [OrderStatus.CANCELLED] },
    },
  ];

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    views,
    meta: {
      currency: account?.currency,
      accountSlug: account?.slug,
      hostSlug,
      includeUncategorized: true,
      accountingCategoryKinds: ContributionAccountingCategoryKinds,
    } as FilterMeta,
  });

  const { data: metadata, refetch: refetchMetadata } = useQuery(expectedFundsMetadataQuery, {
    variables: { slug: account?.slug },
    skip: !account?.slug,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: account?.slug,
      filter: 'INCOMING',
      includeIncognito: true,
      includeChildrenAccounts: true,
      ...queryFilter.variables,
    },
    skip: !account?.slug,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    refetchMetadata();
  }, [refetch, refetchMetadata]);

  const viewsWithCount = views.map(view => ({ ...view, count: metadata?.account?.[view.id]?.totalCount }));
  const currentViewCount = viewsWithCount.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  return (
    <ContributionsTable
      accountSlug={account?.slug}
      hostSlug={hostSlug}
      queryFilter={queryFilter as any}
      views={viewsWithCount}
      orders={orders}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      error={error}
      refetch={handleRefetch}
      onlyExpectedFunds
      columnVisibility={{
        legacyId: true,
        expectedAt: true,
        createdByAccount: true,
        paymentMethod: false,
        fromAccount: false,
        createdAt: false,
        lastChargedAt: false,
        accountingCategory: true,
      }}
    />
  );
}

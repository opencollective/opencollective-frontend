import React from 'react';
import { useQuery } from '@apollo/client';
import { compact } from 'lodash';
import { useRouter } from 'next/router';

import { EMPTY_ARRAY } from '../../../../lib/constants/utils';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { ManagedOrderFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { ExpectedFundsFilter } from '../../../../lib/graphql/types/v2/schema';
import type { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';

import { ContributionDrawer } from '../../../contributions/ContributionDrawer';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';

import { useContributionActions } from './actions';
import { amount, beneficiary, contributionId, contributor, date, expectedAt, paymentMethod, status } from './columns';

const dashboardOrdersQuery = gql`
  query DashboardOrders(
    $slug: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $filter: AccountOrdersFilter!
    $frequency: [ContributionFrequency]
    $status: [OrderStatus!]
    $includeIncognito: Boolean
    $amount: AmountRangeInput
    $paymentMethod: [PaymentMethodReferenceInput]
    $hostContext: HostContext
    $includeChildrenAccounts: Boolean
    $dateFrom: DateTime
    $dateTo: DateTime
    $expectedDateFrom: DateTime
    $expectedDateTo: DateTime
    $chargedDateFrom: DateTime
    $chargedDateTo: DateTime
    $expectedFundsFilter: ExpectedFundsFilter
    $orderBy: ChronologicalOrderInput
    $tier: [TierReferenceInput!]
  ) {
    account(slug: $slug) {
      id
      orders(
        dateFrom: $dateFrom
        dateTo: $dateTo
        expectedDateFrom: $expectedDateFrom
        expectedDateTo: $expectedDateTo
        filter: $filter
        frequency: $frequency
        status: $status
        includeIncognito: $includeIncognito
        amount: $amount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        hostContext: $hostContext
        includeChildrenAccounts: $includeChildrenAccounts
        expectedFundsFilter: $expectedFundsFilter
        orderBy: $orderBy
        chargedDateFrom: $chargedDateFrom
        chargedDateTo: $chargedDateTo
        tier: $tier
      ) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
    }
  }
  ${managedOrderFragment}
`;

export const getColumns = ({ onlyExpectedFunds }: { onlyExpectedFunds?: boolean }) =>
  compact([
    onlyExpectedFunds ? contributionId : null,
    !onlyExpectedFunds && contributor,
    beneficiary,
    amount,
    date,
    paymentMethod,
    onlyExpectedFunds ? expectedAt : null,
    status,
    actionsColumn,
  ]);

export type ContributionsTableProps<FilterValues extends Record<string, unknown>> = {
  accountSlug: string;
  direction: 'INCOMING' | 'OUTGOING';
  queryFilter: useQueryFilterReturnType<any, any, any>;
  views: { id: string; label: string; filter: Partial<FilterValues>; count?: number }[];
  onlyExpectedFunds?: boolean;
  includeChildrenAccounts?: boolean;
  hostSlug?: string;
  emptyMessage?: React.ReactNode;
  onRefetch?: () => void;
};

export default function ContributionsTable<FilterValues extends Record<string, unknown>>({
  accountSlug,
  direction,
  queryFilter,
  views,
  onlyExpectedFunds,
  includeChildrenAccounts = true,
  hostSlug,
  onRefetch,
}: ContributionsTableProps<FilterValues>) {
  const router = useRouter();

  const selectedContributionId = router.query.orderId ? parseInt(router.query.orderId as string) : null;

  const onToggleOrderDrawer = React.useCallback(
    orderId => {
      const newUrl = new URL(router.asPath, window.location.origin);

      if (orderId) {
        newUrl.searchParams.set('orderId', orderId);
      } else {
        newUrl.searchParams.delete('orderId');
      }

      router.push(newUrl.toString(), undefined, { shallow: true });
    },
    [router],
  );

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: direction,
      includeIncognito: true,
      includeChildrenAccounts: !!includeChildrenAccounts,
      ...queryFilter.variables,
      ...(onlyExpectedFunds
        ? {
            expectedFundsFilter:
              (queryFilter.variables as any).expectedFundsFilter || ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
          }
        : { expectedFundsFilter: null }),
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    onRefetch?.();
  }, [refetch, onRefetch]);

  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string | number }; action: EditOrderActions }>({
    order: router.query.orderId ? { id: router.query.orderId as string } : null,
    action: (router.query.action as EditOrderActions) ?? null,
  });

  const selectedOrders = data?.account?.orders.nodes || EMPTY_ARRAY;

  // If editOrderId is in URL, open it directly
  React.useEffect(() => {
    const rawResumeOrderId = router.query.resumeOrderId;
    const resumeOrderId = Array.isArray(rawResumeOrderId) ? rawResumeOrderId[0] : rawResumeOrderId;
    if (resumeOrderId) {
      const order = selectedOrders.find(o => o.legacyId === parseInt(resumeOrderId));
      if (order) {
        setEditOrder({ order, action: 'editPaymentMethod' });
        const [url, rawQuery] = router.asPath.split('?');
        const queryParams = new URLSearchParams(rawQuery);
        queryParams.delete('resumeOrderId');
        const newUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        router.replace(newUrl, undefined, { shallow: true });
      }
    }
  }, [router, selectedOrders]);

  const columns = getColumns({ onlyExpectedFunds });
  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const getActions = useContributionActions({
    accountSlug,
    hostSlug,
    refetchList: handleRefetch,
  });

  return (
    <React.Fragment>
      <Filterbar {...queryFilter} views={views} />

      {queryError ? (
        <MessageBoxGraphqlError error={queryError} />
      ) : !queryLoading && selectedOrders.length === 0 ? (
        <EmptyResults
          entityType="CONTRIBUTIONS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable<ManagedOrderFieldsFragment, unknown>
            loading={queryLoading}
            columns={columns}
            data={selectedOrders}
            mobileTableView
            nbPlaceholders={nbPlaceholders}
            onClickRow={row => onToggleOrderDrawer(row.original.legacyId)}
            getActions={getActions}
          />
        </div>
      )}

      {editOrder.order && (
        <EditOrderModal
          accountSlug={accountSlug}
          order={editOrder.order}
          action={editOrder.action}
          onClose={() => setEditOrder({ order: null, action: null })}
          onSuccess={handleRefetch}
        />
      )}

      <Pagination queryFilter={queryFilter} total={data?.account?.orders.totalCount} />

      <ContributionDrawer
        open={!!selectedContributionId}
        onClose={() => onToggleOrderDrawer(null)}
        orderId={selectedContributionId}
        getActions={getActions}
      />
    </React.Fragment>
  );
}

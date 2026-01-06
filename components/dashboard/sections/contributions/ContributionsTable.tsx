import React from 'react';
import type { ApolloError } from '@apollo/client';
import type { VisibilityState } from '@tanstack/react-table';
import { useRouter } from 'next/router';

import type {
  DashboardOrdersQueryVariables,
  ManagedOrderFieldsFragment,
} from '../../../../lib/graphql/types/v2/graphql';
import type { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';

import { ContributionDrawer } from '../../../contributions/ContributionDrawer';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';

import { useContributionActions } from './actions';
import { columns } from './columns';
import type { FilterMeta, schema } from './filters';

type ContributionsTableProps<FilterValues extends Record<string, unknown>> = {
  accountSlug: string;
  queryFilter: useQueryFilterReturnType<typeof schema, DashboardOrdersQueryVariables, FilterMeta>;
  views?: readonly { id: string; label: string; filter: Partial<FilterValues>; count?: number }[];
  orders: { nodes: ManagedOrderFieldsFragment[]; totalCount: number };
  loading?: boolean;
  nbPlaceholders?: number;
  error?: ApolloError;
  refetch?: () => void;
  onlyExpectedFunds?: boolean;
  hostSlug?: string;
  columnVisibility?: VisibilityState;
};

const defaultVisibility: VisibilityState = {
  legacyId: false,
  expectedAt: false,
  createdAt: false,
};

export default function ContributionsTable<FilterValues extends Record<string, unknown>>({
  accountSlug,
  queryFilter,
  views,
  orders,
  loading,
  nbPlaceholders,
  error,
  refetch,
  hostSlug,
  columnVisibility = defaultVisibility,
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

  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string | number }; action: EditOrderActions }>({
    order: router.query.orderId ? { id: router.query.orderId as string } : null,
    action: (router.query.action as EditOrderActions) ?? null,
  });

  // If editOrderId is in URL, open it directly
  React.useEffect(() => {
    const rawResumeOrderId = router.query.resumeOrderId;
    const resumeOrderId = Array.isArray(rawResumeOrderId) ? rawResumeOrderId[0] : rawResumeOrderId;
    if (resumeOrderId) {
      const order = orders.nodes.find(o => o.legacyId === parseInt(resumeOrderId));
      if (order) {
        setEditOrder({ order, action: 'editPaymentMethod' });
        const [url, rawQuery] = router.asPath.split('?');
        const queryParams = new URLSearchParams(rawQuery);
        queryParams.delete('resumeOrderId');
        const newUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        router.replace(newUrl, undefined, { shallow: true });
      }
    }
  }, [router, orders.nodes]);

  const getActions = useContributionActions({
    accountSlug,
    hostSlug,
    refetchList: refetch,
  });

  return (
    <React.Fragment>
      <Filterbar {...queryFilter} {...(views && { views })} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && orders.nodes.length === 0 ? (
        <EmptyResults
          entityType="CONTRIBUTIONS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable<ManagedOrderFieldsFragment, unknown>
            loading={loading}
            columns={columns}
            data={orders.nodes}
            mobileTableView
            nbPlaceholders={nbPlaceholders}
            onClickRow={row => onToggleOrderDrawer(row.original.legacyId)}
            getActions={getActions}
            columnVisibility={columnVisibility}
          />
        </div>
      )}

      <EditOrderModal
        accountSlug={accountSlug}
        order={editOrder.order}
        action={editOrder.action}
        open={Boolean(editOrder.order)}
        setOpen={open => !open && setEditOrder({ order: null, action: null })}
        onSuccess={refetch}
      />

      <Pagination queryFilter={queryFilter} total={orders.totalCount} />

      <ContributionDrawer
        open={!!selectedContributionId}
        onClose={() => onToggleOrderDrawer(null)}
        orderId={selectedContributionId}
        getActions={getActions}
      />
    </React.Fragment>
  );
}

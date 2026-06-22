import React from 'react';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import { gql } from '@/lib/graphql/helpers';
import type { TransactionsTableQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { TransactionKind } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { useTransactionActions } from '@/components/dashboard/sections/transactions/actions';
import { filters, schema, toVariables } from '@/components/dashboard/sections/transactions/filters';
import { transactionsTableQuery } from '@/components/dashboard/sections/transactions/queries';
import type { TransactionsTableProps } from '@/components/dashboard/sections/transactions/TransactionsTable';
import TransactionsTable from '@/components/dashboard/sections/transactions/TransactionsTable';
import type { TransactionsTableQueryNode } from '@/components/dashboard/sections/transactions/types';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import type { HostedAccountProfileData } from './types';

export type MoneyMovementsView = 'ALL' | 'CONTRIBUTIONS' | 'PAYOUTS';

type HostedAccountMoneyMovementsTabProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
  initialView?: MoneyMovementsView;
};

const moneyMovementsCountsQuery = gql`
  query HostedAccountMoneyMovementsCounts($account: [AccountReferenceInput!], $host: AccountReferenceInput!) {
    all: transactions(account: $account, host: $host, includeChildrenTransactions: true, limit: 0) {
      totalCount
    }
    contributions: transactions(
      account: $account
      host: $host
      kind: [ADDED_FUNDS, CONTRIBUTION]
      includeChildrenTransactions: true
      limit: 0
    ) {
      totalCount
    }
    payouts: transactions(
      account: $account
      host: $host
      kind: [EXPENSE]
      includeChildrenTransactions: true
      limit: 0
    ) {
      totalCount
    }
  }
`;

export function HostedAccountMoneyMovementsTab({
  account,
  hostSlug,
  initialView,
}: HostedAccountMoneyMovementsTabProps) {
  const intl = useIntl();
  const [openExpenseId, setOpenExpenseId] = React.useState<number | null>(null);
  const [openContributionId, setOpenContributionId] = React.useState<number | null>(null);

  const views = React.useMemo(
    () => [
      { id: 'ALL', label: intl.formatMessage({ defaultMessage: 'All', id: 'All' }), filter: {} },
      {
        id: 'CONTRIBUTIONS',
        label: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
        filter: { kind: [TransactionKind.ADDED_FUNDS, TransactionKind.CONTRIBUTION] },
      },
      {
        id: 'PAYOUTS',
        label: intl.formatMessage({ defaultMessage: 'Payouts', id: 'Payouts' }),
        filter: { kind: [TransactionKind.EXPENSE] },
      },
    ],
    [intl],
  );

  const defaultFilterValues = React.useMemo(
    () => views.find(view => view.id === initialView)?.filter,
    [views, initialView],
  );

  const queryFilter = useQueryFilter<typeof schema, TransactionsTableQueryVariables>({
    schema,
    toVariables,
    filters,
    views,
    defaultFilterValues,
    skipRouter: true,
    meta: { currency: account?.currency },
  });

  const { data: counts } = useQuery(moneyMovementsCountsQuery, {
    variables: { account: [{ id: account?.id }], host: { slug: hostSlug } },
    skip: !account?.id,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    skip: !account?.id,
  });

  const transactions = data?.transactions;
  const getActions = useTransactionActions<TransactionsTableQueryNode>({ resetFilters: queryFilter.resetFilters });

  const handleRowClick: TransactionsTableProps['onClickRow'] = row => {
    if ('expense' in row.original && row.original.expense) {
      setOpenExpenseId(row.original.expense.legacyId);
      return true;
    } else if ('order' in row.original && row.original.order) {
      setOpenContributionId(row.original.order.legacyId);
      return true;
    }
    return false;
  };

  const viewsWithCount = views.map(view => ({
    ...view,
    count:
      view.id === 'ALL'
        ? counts?.all?.totalCount
        : view.id === 'CONTRIBUTIONS'
          ? counts?.contributions?.totalCount
          : counts?.payouts?.totalCount,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Filterbar {...queryFilter} views={viewsWithCount} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <TransactionsTable
          transactions={transactions}
          loading={loading}
          nbPlaceholders={queryFilter.values.limit}
          queryFilter={queryFilter}
          refetchList={refetch}
          onClickRow={handleRowClick}
          getActions={getActions}
        />
      )}

      {openExpenseId && (
        <ExpenseDrawer openExpenseLegacyId={openExpenseId} handleClose={() => setOpenExpenseId(null)} />
      )}
      {openContributionId && (
        <ContributionDrawer
          open
          onClose={() => setOpenContributionId(null)}
          orderId={openContributionId}
          getActions={() => ({})}
        />
      )}
    </div>
  );
}

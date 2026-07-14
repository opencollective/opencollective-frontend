import React from 'react';
import { FormattedMessage } from 'react-intl';

import TransactionsTable, {
  type TransactionsTableProps,
} from '@/components/dashboard/sections/transactions/TransactionsTable';

export const RecentTransactionsCard = ({
  title,
  transactions,
  loading,
  queryFilter,
  refetch,
  onRowClick,
  onViewAll,
}: {
  title: React.ReactNode;
  transactions: TransactionsTableProps['transactions'];
  loading?: boolean;
  queryFilter: TransactionsTableProps['queryFilter'];
  refetch: TransactionsTableProps['refetchList'];
  onRowClick: TransactionsTableProps['onClickRow'];
  onViewAll: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-medium text-slate-800">{title}</h3>
    <TransactionsTable
      transactions={transactions}
      loading={loading}
      nbPlaceholders={5}
      queryFilter={queryFilter}
      refetchList={refetch}
      hideHeader
      hidePagination
      meta={{ timeStyle: null }}
      onClickRow={onRowClick}
      columns={['date', 'account', 'amount', 'currency']}
      footer={
        !(loading && !transactions?.nodes?.length) && (
          <div className="flex min-h-[49px] w-full items-center justify-center border-t">
            <button
              onClick={onViewAll}
              className="font-normal text-muted-foreground hover:text-foreground hover:underline"
            >
              <FormattedMessage defaultMessage="View all" id="pFK6bJ" />
            </button>
          </div>
        )
      }
    />
  </div>
);

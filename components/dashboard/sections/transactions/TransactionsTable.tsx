import React from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { clsx } from 'clsx';
import { AlertTriangle, ArrowLeft, ArrowRight, Undo } from 'lucide-react';
import { defineMessage, FormattedMessage } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { TransactionsTableQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { DateTimeField } from '../../../../lib/graphql/types/v2/graphql';
import { useDrawer } from '../../../../lib/hooks/useDrawer';
import useLocalStorage from '../../../../lib/hooks/useLocalStorage';
import type { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { ColumnHeader } from '../../../table/ColumnHeader';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Pagination } from '../../filters/Pagination';

import { useTransactionActions } from './actions';
import type { schema } from './filters';
import { TransactionDrawer } from './TransactionDrawer';
import type { TransactionsTableQueryNode } from './types';

const columnHelper = createColumnHelper<TransactionsTableQueryNode>();

const RefundLabel = ({ transaction }) => {
  const { isRefund, isOrderRejected, refundKind, paymentMethod } = transaction;
  const wasActuallyRefunded = ['STRIPE', 'PAYPAL'].includes(paymentMethod?.service);

  if (isRefund) {
    return wasActuallyRefunded ? (
      <FormattedMessage defaultMessage="Refund" id="Refund" />
    ) : (
      <FormattedMessage defaultMessage="Reverse" id="Reverse" />
    );
  } else {
    if (isOrderRejected) {
      return <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />;
    } else if (!refundKind && wasActuallyRefunded) {
      return <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />;
    }

    switch (refundKind) {
      case 'REJECT':
        return <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />;
      case 'DISPUTE':
        return <FormattedMessage defaultMessage="Disputed" id="X1pwhF" />;
      case 'REFUND':
        return <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />;
      default:
        return <FormattedMessage defaultMessage="Reverted" id="transaction.reverted" />;
    }
  }
};

const RefundBadge = ({ transaction }) => {
  const { isRefund, isRefunded, isDisputed, isOrderRejected } = transaction;
  return (
    <React.Fragment>
      {isRefunded && !isOrderRejected && (
        <Badge size="xs" type={'warning'} className="items-center gap-1">
          <Undo size={12} />
          <RefundLabel transaction={transaction} />{' '}
        </Badge>
      )}
      {isRefund && (
        <Badge size="xs" type={'success'} className="items-center gap-1">
          <RefundLabel transaction={transaction} />{' '}
        </Badge>
      )}
      {isDisputed && (
        <Badge size="xs" type={'error'} className="items-center gap-1">
          <AlertTriangle size={12} />
          <RefundLabel transaction={transaction} />{' '}
        </Badge>
      )}
      {isOrderRejected && isRefunded && (
        <Badge size="xs" type={'error'} className="items-center gap-1">
          <AlertTriangle size={12} />
          <RefundLabel transaction={transaction} />{' '}
        </Badge>
      )}{' '}
    </React.Fragment>
  );
};

export const columns: ColumnDef<TransactionsTableQueryNode>[] = [
  columnHelper.accessor('createdAt', {
    id: 'date',
    meta: { className: 'w-48', labelMsg: defineMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' }) },
    header: ctx => <ColumnHeader {...ctx} sortField={DateTimeField.CREATED_AT} />,
    cell: ({ cell, table }) => {
      const createdAt = cell.getValue() as TransactionsTableQueryNode['createdAt'];
      const timeStyle = table.options.meta?.timeStyle === null ? undefined : table.options.meta?.timeStyle || 'short';
      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle={timeStyle} value={createdAt} />
        </div>
      );
    },
  }),
  columnHelper.accessor('clearedAt', {
    meta: { className: 'w-48', labelMsg: defineMessage({ defaultMessage: 'Effective Date', id: 'Gh3Obs' }) },
    header: ctx => <ColumnHeader {...ctx} sortField={DateTimeField.EFFECTIVE_DATE} />,
    cell: ({ cell, row }) => {
      const clearedAt = cell.getValue() as TransactionsTableQueryNode['clearedAt'];
      if (!clearedAt) {
        return (
          <div className="whitespace-nowrap text-green-500">
            <DateTime dateStyle="medium" timeStyle="short" value={row.original.createdAt} />
          </div>
        );
      }
      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle="short" value={clearedAt} />
        </div>
      );
    },
  }),
  columnHelper.accessor('account', {
    id: 'account',
    meta: { className: 'w-32 2xl:w-48', labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ cell }) => {
      const account = cell.getValue();

      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-1 truncate">
              <Avatar collective={account} radius={20} />
              <span className="truncate">{account?.name}</span>
            </div>
          }
        />
      );
    },
  }),
  columnHelper.accessor('oppositeAccount', {
    id: 'oppositeAccount',
    meta: { className: 'w-48', labelMsg: defineMessage({ defaultMessage: 'Recipient/Sender', id: 'YT2bNN' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ cell, row }) => {
      const account = cell.getValue();
      const transaction = row.original;
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-1 truncate">
              {transaction.type === 'CREDIT' ? (
                <ArrowLeft className="inline-block shrink-0 text-green-600" size={16} />
              ) : (
                <ArrowRight className="inline-block shrink-0" size={16} />
              )}
              <Avatar collective={account} radius={20} />
              <span className="truncate">{account?.name}</span>
            </div>
          }
        />
      );
    },
  }),

  columnHelper.accessor('kind', {
    id: 'kind',
    meta: { className: 'w-32 2xl:w-auto', labelMsg: defineMessage({ defaultMessage: 'Kind', id: 'Transaction.Kind' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ cell, table, row }) => {
      const { intl } = table.options.meta;
      const kind = cell.getValue();
      const kindLabel = i18nTransactionKind(intl, kind);
      const isExpense = kind === 'EXPENSE';
      const { isInReview, expense } = row.original;

      return (
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{kindLabel}</span>
            {isExpense && expense?.type && <Badge size="xs">{i18nExpenseType(intl, expense.type)}</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <RefundBadge transaction={row.original} />
            {isInReview && (
              <Badge size="xs" type={'warning'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage id="order.in_review" defaultMessage="In Review" />
              </Badge>
            )}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor(({ netAmount, type }) => (type === 'DEBIT' ? netAmount : null), {
    id: 'debit',
    header: ctx => <ColumnHeader {...ctx} />,
    meta: {
      className: 'w-28',
      labelMsg: defineMessage({ defaultMessage: 'Debit', id: 'Expense.Type.Debit' }),
      align: 'right',
    },
    cell: ({ cell }) => {
      const amount = cell.getValue() as TransactionsTableQueryNode['netAmount'];
      if (amount) {
        return (
          <div className="flex items-center justify-end gap-2 truncate font-semibold text-slate-700 antialiased">
            <FormattedMoneyAmount
              amount={Math.abs(amount.valueInCents)}
              currency={amount.currency}
              precision={2}
              showCurrencyCode={false}
            />
          </div>
        );
      }
      return null;
    },
  }),
  columnHelper.accessor(({ netAmount, type }) => (type === 'CREDIT' ? netAmount : null), {
    id: 'credit',
    header: ctx => <ColumnHeader {...ctx} />,
    meta: {
      className: 'w-28',
      labelMsg: defineMessage({ defaultMessage: 'Credit', id: 'Transaction.Type.Credit' }),
      align: 'right',
    },
    cell: ({ cell }) => {
      const amount = cell.getValue() as TransactionsTableQueryNode['netAmount'];
      if (amount) {
        return (
          <div className="truncate font-semibold text-slate-700 antialiased">
            <FormattedMoneyAmount
              amount={Math.abs(amount.valueInCents)}
              currency={amount.currency}
              precision={2}
              showCurrencyCode={false}
            />
          </div>
        );
      }
      return null;
    },
  }),
  columnHelper.accessor('netAmount', {
    id: 'amount',
    meta: {
      className: 'w-28',
      align: 'right',
      labelMsg: defineMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }),
    },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ cell, row }) => {
      const netAmount = cell.getValue() as TransactionsTableQueryNode['netAmount'];
      const transaction = row.original;

      return (
        <div
          className={clsx(
            'truncate font-semibold antialiased',
            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-slate-700',
          )}
        >
          <FormattedMoneyAmount
            amount={netAmount.valueInCents}
            currency={netAmount.currency}
            precision={2}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  }),

  columnHelper.accessor('netAmount.currency', {
    id: 'currency',
    header: null,
    meta: { className: 'w-12', labelMsg: defineMessage({ defaultMessage: 'Currency', id: 'Currency' }) },
    cell: ({ cell }) => {
      const value = cell.getValue();

      return <div className="antialiased">{value}</div>;
    },
  }),
  actionsColumn,
];

export type TransactionsTableProps = {
  transactions: { nodes: TransactionsTableQueryNode[]; totalCount: number };
  loading?: boolean;
  nbPlaceholders?: number;
  useAltTestLayout?: boolean;
  queryFilter: useQueryFilterReturnType<typeof schema, TransactionsTableQueryVariables>;
  refetchList?: () => void;
  columns?: string[];
  hideHeader?: boolean;
  hidePagination?: boolean;
  footer?: React.ReactNode;
  meta?: {
    timeStyle?: 'short' | 'long' | 'medium' | 'full' | 'none' | null;
  };
  /** You optionally override onClickRow with a function that returns a boolean that informs if the override is successfully or not.
   * When returning false, TransactionsTable will open its own transaction drawer.
   */
  onClickRow?: (row: Row<TransactionsTableQueryNode>) => boolean;
  /** Optional custom getActions to override the default transaction actions. */
  getActions?: GetActions<TransactionsTableQueryNode>;
};

export default function TransactionsTable({
  transactions,
  loading,
  nbPlaceholders,
  queryFilter,
  refetchList,
  columns: displayedColumnsIds,
  hideHeader,
  hidePagination,
  footer,
  onClickRow,
  meta,
  getActions: getActionsProp,
}: TransactionsTableProps) {
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null);

  const defaultColumnVisibility = {
    clearedAt: false,
    debit: false,
    credit: false,
  };
  const [columnVisibility, setColumnVisibility] = useLocalStorage('transactions-cols', defaultColumnVisibility);
  const displayedColumns = React.useMemo(() => {
    if (displayedColumnsIds?.length) {
      return columns.filter(column => displayedColumnsIds.includes(column.id));
    }
    return columns;
  }, [displayedColumnsIds]);

  const getDefaultActions = useTransactionActions<TransactionsTableQueryNode>({
    resetFilters: queryFilter.resetFilters,
    refetchList,
  });

  const getActions = React.useMemo(() => getActionsProp ?? getDefaultActions, [getActionsProp, getDefaultActions]);

  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(queryFilter.values.openTransactionId),
    onOpen: id => queryFilter.setFilter('openTransactionId', id, false),
    onClose: () => queryFilter.setFilter('openTransactionId', undefined, false),
  });

  return (
    <React.Fragment>
      <DataTable
        data-cy="transactions-table"
        innerClassName="table-fixed text-muted-foreground"
        columns={displayedColumns}
        data={transactions?.nodes || []}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        onClickRow={(row, menuRef) => {
          return onClickRow?.(row) || openDrawer(row.id, menuRef);
        }}
        onHoverRow={row => setHoveredGroup(row?.original?.group ?? null)}
        rowHasIndicator={row => row.original.group === hoveredGroup}
        mobileTableView
        columnVisibility={displayedColumnsIds ? undefined : columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultColumnVisibility={defaultColumnVisibility}
        getRowId={row => String(row.legacyId)}
        getActions={getActions}
        queryFilter={queryFilter}
        hideHeader={hideHeader}
        footer={footer}
        meta={meta}
        compact
      />

      {!hidePagination && <Pagination queryFilter={queryFilter} total={transactions?.totalCount} />}
      <TransactionDrawer
        {...drawerProps}
        transactionId={queryFilter.values.openTransactionId}
        getActions={getActions}
      />
    </React.Fragment>
  );
}

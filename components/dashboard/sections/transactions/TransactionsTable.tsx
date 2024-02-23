import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import clsx from 'clsx';
import { AlertTriangle, ArrowLeft, ArrowRight, MoreHorizontal, Undo } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Transaction } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { DataTable } from '../../../DataTable';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';

const cols = {
  createdAt: {
    accessorKey: 'createdAt',
    meta: { className: 'w-48' },
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    cell: ({ cell }) => {
      const createdAt = cell.getValue() as Transaction['createdAt'];

      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle="short" value={createdAt} />
        </div>
      );
    },
  },
  credit: {
    accessorKey: 'credit',
    header: () => <FormattedMessage id="Transaction.Type.Credit" defaultMessage="Credit" />,
    meta: { className: 'w-28 text-right' },
    cell: ({ row }) => {
      const netAmount = row.original.netAmount;
      const type = row.original.type;
      if (type === 'CREDIT') {
        return (
          <div className="flex items-center justify-end gap-2 truncate font-semibold text-slate-700 antialiased">
            <FormattedMoneyAmount
              amount={Math.abs(netAmount.valueInCents)}
              currency={netAmount.currency}
              precision={2}
              amountStyles={{}}
              showCurrencyCode={false}
            />
          </div>
        );
      }
      return null;
    },
  },
  debit: {
    accessorKey: 'debit',
    header: () => <FormattedMessage id="Expense.Type.Debit" defaultMessage="Debit" />,
    meta: { className: 'w-28 text-right' },
    cell: ({ row }) => {
      const netAmount = row.original.netAmount;
      const type = row.original.type;
      if (type === 'DEBIT') {
        return (
          <div className="flex items-center justify-end gap-2 truncate font-semibold text-slate-700 antialiased">
            <FormattedMoneyAmount
              amount={Math.abs(netAmount.valueInCents)}
              currency={netAmount.currency}
              precision={2}
              amountStyles={{}}
              showCurrencyCode={false}
            />
          </div>
        );
      }
      return null;
    },
  },
  account: {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    meta: { className: 'w-32 2xl:w-48' },
    cell: ({ cell }) => {
      const account = cell.getValue() as Transaction['account'];

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
  },
  oppositeAccount: {
    accessorKey: 'oppositeAccount',
    header: () => <FormattedMessage defaultMessage="Opposite account" />,
    meta: { className: 'w-32 2xl:w-48' },
    cell: ({ cell }) => {
      const account = cell.getValue() as Transaction['oppositeAccount'];
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
  },
  toFromAccount: {
    accessorKey: 'oppositeAccount',
    header: () => <FormattedMessage defaultMessage="Recipient/Sender" />,
    meta: { className: 'w-48' },
    cell: ({ cell, row }) => {
      const account = cell.getValue() as Transaction['oppositeAccount'];
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
  },
  kind: {
    accessorKey: 'kind',
    meta: { className: 'w-32 2xl:w-auto' },
    header: () => <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
    cell: ({ cell, table, row }) => {
      const { intl } = table.options.meta as { intl: any };
      const kind = cell.getValue() as Transaction['kind'];
      const kindLabel = i18nTransactionKind(intl, kind);
      const isExpense = kind === 'EXPENSE';
      const { isRefund, isRefunded, isInReview, isDisputed, expense, isOrderRejected } = row.original;

      return (
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{kindLabel}</span>
            {isExpense && expense?.type && <Badge size="xs">{i18nExpenseType(intl, expense.type)}</Badge>}
          </div>
          <div>
            {isRefunded && !isOrderRejected && (
              <Badge size="xs" type={'warning'} className="items-center  gap-1">
                <Undo size={12} />
                <FormattedMessage defaultMessage="Refunded" />
              </Badge>
            )}
            {isRefund && (
              <Badge size="xs" type={'success'} className="items-center gap-1">
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </Badge>
            )}
            {isDisputed && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Disputed" />
              </Badge>
            )}
            {isOrderRejected && isRefunded && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Rejected" />
              </Badge>
            )}
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
  },
  netAmount: {
    accessorKey: 'netAmount',
    header: () => <FormattedMessage defaultMessage="Net Amount" />,
    meta: { className: 'w-28 text-right' },
    cell: ({ cell, row }) => {
      const netAmount = cell.getValue() as Transaction['netAmount'];
      const transaction = row.original;

      return (
        <div
          className={clsx(
            'flex items-center justify-end gap-2 truncate font-semibold antialiased',
            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-slate-700',
          )}
        >
          <FormattedMoneyAmount
            amount={netAmount.valueInCents}
            currency={netAmount.currency}
            precision={2}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
  currency: {
    accessorKey: 'currency',
    header: () => null,
    meta: { className: 'w-12 text-left' },
    cell: ({ row }) => {
      const amount = row.original.amount;

      return <div className="antialiased">{amount.currency}</div>;
    },
  },
  actions: {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-16' },
    enableHiding: false,
    cell: () => {
      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-7 w-7 border-transparent group-hover:border-border">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <FormattedMessage defaultMessage="View details" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
};

const getColumns = (useAltLayout?: boolean): ColumnDef<Transaction>[] => {
  return useAltLayout
    ? [
        cols.createdAt,
        cols.kind,
        cols.debit,
        cols.credit,
        cols.currency,
        cols.account,
        cols.oppositeAccount,
        cols.actions,
      ]
    : [cols.createdAt, cols.account, cols.toFromAccount, cols.kind, cols.netAmount, cols.currency, cols.actions];
};

type TransactionsTableProps = {
  transactions: { nodes: Transaction[] };
  loading?: boolean;
  nbPlaceholders?: number;
  onClickRow: (transaction: Transaction) => void;
  useAltTestLayout?: boolean;
};

export default function TransactionsTable({
  transactions,
  loading,
  nbPlaceholders,
  onClickRow,
  useAltTestLayout,
}: TransactionsTableProps) {
  const intl = useIntl();
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null);
  const { LoggedInUser } = useLoggedInUser();
  const hasDynamicTopBar = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DYNAMIC_TOP_BAR);
  const columns = getColumns(useAltTestLayout);
  return (
    <DataTable
      data-cy="transactions-table"
      innerClassName="table-fixed text-muted-foreground"
      columns={columns}
      data={transactions?.nodes || []}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      onClickRow={row => onClickRow(row.original)}
      onHoverRow={row => setHoveredGroup(row?.original?.group ?? null)}
      rowHasIndicator={row => row.original.group === hoveredGroup}
      fullWidth={hasDynamicTopBar}
      mobileTableView
      compact
      meta={{ intl }}
    />
  );
}

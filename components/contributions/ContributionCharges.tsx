import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowLeftRightIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { ContributionDrawerQuery, TransactionsTableQueryVariables } from '../../lib/graphql/types/v2/graphql';
import { TransactionKind, TransactionType } from '../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import { i18nTransactionKind } from '../../lib/i18n/transaction';

import {
  filters as transactionFilters,
  schema as transactionFilterSchema,
  toVariables as transactionFiltersToVariables,
} from '../dashboard/sections/transactions/filters';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { actionsColumn, DataTable } from '../table/DataTable';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

import { getPrimaryContributionTransaction } from './transactionUtils';
import { useChargeActions } from './useChargeActions';

type ContributionTransaction = ContributionDrawerQuery['order']['transactions'][number];

const CHARGE_TRANSACTION_KINDS = [
  TransactionKind.CONTRIBUTION,
  TransactionKind.ADDED_FUNDS,
  TransactionKind.BALANCE_TRANSFER,
  TransactionKind.PLATFORM_TIP,
  TransactionKind.TAX,
];

type ChargeGroup = {
  group: string;
  primaryTransaction: ContributionTransaction;
  transactions: ContributionTransaction[];
  amount: ContributionTransaction['amount'];
};

const chargeColumnHelper = createColumnHelper<ChargeGroup>();

const getTimestamp = (value: string | Date) => new Date(value).getTime();

function getChargeGroupAmount(
  order: ContributionDrawerQuery['order'],
  transactions: ContributionTransaction[],
  primaryTransaction: ContributionTransaction,
): ContributionTransaction['amount'] {
  const contributorDebits = transactions.filter(
    transaction =>
      transaction.type === TransactionType.DEBIT &&
      transaction.account?.id === order.fromAccount?.id &&
      transaction.kind &&
      CHARGE_TRANSACTION_KINDS.includes(transaction.kind) &&
      !transaction.isRefund,
  );

  const valueInCents = contributorDebits.reduce(
    (total, transaction) => total + Math.abs(transaction.amount.valueInCents || 0),
    0,
  );

  if (valueInCents > 0) {
    return {
      ...contributorDebits[0].amount,
      valueInCents,
    };
  }

  return {
    ...primaryTransaction.amount,
    valueInCents: Math.abs(primaryTransaction.amount.valueInCents || 0),
  };
}

function buildChargeGroups(order: ContributionDrawerQuery['order']): ChargeGroup[] {
  const byGroup = new Map<string, ContributionTransaction[]>();

  for (const transaction of order?.transactions || []) {
    byGroup.set(transaction.group, [...(byGroup.get(transaction.group) || []), transaction]);
  }

  return Array.from(byGroup.entries())
    .map(([group, transactions]) => {
      const primaryTransaction = getPrimaryContributionTransaction(transactions);
      return {
        group,
        primaryTransaction,
        transactions,
        amount: getChargeGroupAmount(order, transactions, primaryTransaction),
      };
    })
    .filter(chargeGroup => !chargeGroup.primaryTransaction.isRefund)
    .sort((a, b) => getTimestamp(b.primaryTransaction.createdAt) - getTimestamp(a.primaryTransaction.createdAt));
}

function ChargeStatusBadge({ chargeGroup }: { chargeGroup: ChargeGroup }) {
  if (chargeGroup.primaryTransaction.isOrderRejected) {
    return (
      <Badge size="xs" type="error">
        <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />
      </Badge>
    );
  } else if (chargeGroup.primaryTransaction.isRefunded) {
    return (
      <Badge size="xs" type="warning">
        <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />
      </Badge>
    );
  }

  return (
    <Badge size="xs" type="success">
      <FormattedMessage defaultMessage="Succeeded" id="E9Iat2" />
    </Badge>
  );
}

const chargeColumns: ColumnDef<ChargeGroup>[] = [
  chargeColumnHelper.display({
    id: 'date',
    meta: { className: 'whitespace-nowrap' },
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ row }) => <DateTime value={row.original.primaryTransaction.createdAt} dateStyle="medium" />,
  }),
  chargeColumnHelper.display({
    id: 'description',
    meta: { className: 'min-w-0 max-w-64' },
    header: () => <FormattedMessage defaultMessage="Description" id="Fields.description" />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta;
      const { primaryTransaction } = row.original;
      const description = primaryTransaction.description || i18nTransactionKind(intl, primaryTransaction.kind);
      return (
        <div className="truncate" title={description}>
          {description}
        </div>
      );
    },
  }),
  chargeColumnHelper.accessor('amount', {
    meta: { className: 'font-medium whitespace-nowrap' },
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ cell }) => {
      const amount = cell.getValue() as ChargeGroup['amount'];
      return (
        <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} precision={2} showCurrencyCode />
      );
    },
  }),
  chargeColumnHelper.display({
    id: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="tzMNF3" />,
    cell: ({ row }) => <ChargeStatusBadge chargeGroup={row.original} />,
  }),
  actionsColumn,
];

export function ContributionCharges({
  isLoading,
  order,
  transactionsUrl,
}: {
  isLoading: boolean;
  order: ContributionDrawerQuery['order'];
  transactionsUrl: URL | undefined;
}) {
  const chargeGroups = React.useMemo(() => (order ? buildChargeGroups(order) : []), [order]);
  const transactionsQueryFilter = useQueryFilter<typeof transactionFilterSchema, TransactionsTableQueryVariables>({
    schema: transactionFilterSchema,
    toVariables: transactionFiltersToVariables,
    filters: transactionFilters,
    skipRouter: true,
  });
  const getChargeTransactionActions = useChargeActions({
    resetFilters: transactionsQueryFilter.resetFilters,
    redirectRelatedTransactionsTo: transactionsUrl?.pathname,
  });
  const getChargeActions = React.useCallback(
    (chargeGroup: ChargeGroup, onCloseFocusRef) =>
      getChargeTransactionActions(chargeGroup.primaryTransaction, onCloseFocusRef),
    [getChargeTransactionActions],
  );

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between gap-2 py-4">
        <div className="text-slate-80 w-fit text-base leading-6 font-bold">
          <FormattedMessage defaultMessage="Charges" id="Dx5IBb"  />
        </div>
        <hr className="grow border-neutral-300" />
        <Button
          asChild
          variant="outline"
          size="xs"
          disabled={isLoading}
          loading={isLoading}
          data-cy="view-transactions-button"
        >
          <Link href={transactionsUrl?.toString() || '#'} className="flex flex-row items-center gap-2.5">
            <ArrowLeftRightIcon size={16} className="text-muted-foreground" />
            <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
          </Link>
        </Button>
      </div>

      <DataTable
        columns={chargeColumns}
        data={chargeGroups}
        loading={isLoading}
        nbPlaceholders={2}
        getRowId={chargeGroup => chargeGroup.group}
        getActions={getChargeActions}
        emptyMessage={() => <FormattedMessage defaultMessage="No charges" id="WL+x9w" />}
        compact
        showQuickActions
      />
    </div>
  );
}

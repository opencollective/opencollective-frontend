import React from 'react';
import { groupBy } from 'lodash-es';
import { FormattedMessage, useIntl } from 'react-intl';

import { TransactionKind, TransactionTypes } from '../../../../lib/constants/transactions';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';
import { cn } from '../../../../lib/utils';

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';

type PaymentIntentTransaction = {
  id: string;
  kind: string;
  type?: string;
  group?: string;
  amount: {
    valueInCents: number;
    currency: string;
  };
  account?: {
    name?: string;
    slug?: string;
    imageUrl?: string;
  };
  oppositeAccount?: {
    name?: string;
    slug?: string;
    imageUrl?: string;
  };
};

type TransactionRow = {
  id: string;
  kind: string;
  transaction: PaymentIntentTransaction;
};

const KIND_ORDER = [
  TransactionKind.CONTRIBUTION,
  TransactionKind.EXPENSE,
  TransactionKind.ADDED_FUNDS,
  TransactionKind.BALANCE_TRANSFER,
  TransactionKind.PAYMENT_PROCESSOR_FEE,
  TransactionKind.HOST_FEE,
  TransactionKind.PLATFORM_FEE,
  TransactionKind.HOST_FEE_SHARE,
  TransactionKind.PLATFORM_TIP,
  TransactionKind.TAX,
  TransactionKind.APPLICATION_FEE,
  TransactionKind.PAYMENT_PROCESSOR_COVER,
  TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE,
  TransactionKind.PREPAID_PAYMENT_METHOD,
  TransactionKind.HOST_FEE_SHARE_DEBT,
  TransactionKind.PLATFORM_TIP_DEBT,
];

const FEE_KINDS = new Set([
  TransactionKind.PAYMENT_PROCESSOR_FEE,
  TransactionKind.HOST_FEE,
  TransactionKind.PLATFORM_FEE,
  TransactionKind.HOST_FEE_SHARE,
  TransactionKind.PLATFORM_TIP,
  TransactionKind.TAX,
  TransactionKind.APPLICATION_FEE,
  TransactionKind.PAYMENT_PROCESSOR_COVER,
  TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE,
  TransactionKind.HOST_FEE_SHARE_DEBT,
  TransactionKind.PLATFORM_TIP_DEBT,
]);

function sortKinds(a: string, b: string) {
  const aIndex = KIND_ORDER.indexOf(a);
  const bIndex = KIND_ORDER.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }
  if (aIndex === -1) {
    return 1;
  }
  if (bIndex === -1) {
    return -1;
  }
  return aIndex - bIndex;
}

/**
 * Ledger entries are double-sided (DEBIT + CREDIT). Pick the debit side as the
 * representative row — it shows the natural "from → to" flow and absolute amount.
 */
function pickRepresentativeTransaction(transactions: PaymentIntentTransaction[]) {
  return transactions.find(transaction => transaction.type === TransactionTypes.DEBIT) || transactions[0];
}

function buildTransactionRows(transactions: PaymentIntentTransaction[]): TransactionRow[] {
  const byKind = groupBy(transactions, transaction => transaction.kind);

  return Object.entries(byKind)
    .flatMap(([kind, kindTransactions]) => {
      const byGroup = groupBy(kindTransactions, transaction => transaction.group || transaction.id);
      return Object.values(byGroup).map(groupTransactions => ({
        id: pickRepresentativeTransaction(groupTransactions).id,
        kind,
        transaction: pickRepresentativeTransaction(groupTransactions),
      }));
    })
    .sort((a, b) => sortKinds(a.kind, b.kind));
}

function AccountFlow({ transaction }: { transaction: PaymentIntentTransaction }) {
  return (
    <span className="flex min-w-0 items-center gap-1 truncate text-muted-foreground">
      <span className="inline-flex min-w-0 items-center gap-1">
        {transaction.account?.imageUrl && <Avatar collective={transaction.account} radius={14} />}
        <span className="truncate">{transaction.account?.name || '-'}</span>
      </span>
      <span aria-hidden="true">→</span>
      <span className="inline-flex min-w-0 items-center gap-1">
        {transaction.oppositeAccount?.imageUrl && <Avatar collective={transaction.oppositeAccount} radius={14} />}
        <span className="truncate">{transaction.oppositeAccount?.name || '-'}</span>
      </span>
    </span>
  );
}

export function PaymentIntentTransactions({ transactions }: { transactions: PaymentIntentTransaction[] }) {
  const intl = useIntl();
  const rows = buildTransactionRows(transactions);

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        <FormattedMessage
          defaultMessage="No transactions linked to this payment intent yet."
          id="PaymentIntent.NoTransactions"
        />
      </p>
    );
  }

  return (
    <div className="divide-y rounded-lg border text-sm">
      {rows.map(({ id, kind, transaction }) => {
        const isFee = FEE_KINDS.has(kind);
        const amount = Math.abs(transaction.amount.valueInCents);

        return (
          <div key={id} className="flex items-center gap-3 px-3 py-2">
            <span
              className={cn('w-32 shrink-0 truncate', isFee ? 'text-muted-foreground' : 'font-medium')}
              title={i18nTransactionKind(intl, kind)}
            >
              {i18nTransactionKind(intl, kind)}
            </span>
            <AccountFlow transaction={transaction} />
            <span className={cn('shrink-0 font-medium whitespace-nowrap', isFee && 'text-muted-foreground')}>
              <FormattedMoneyAmount amount={amount} currency={transaction.amount.currency} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

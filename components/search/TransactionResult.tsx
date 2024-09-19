import React from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { Transaction } from '../../lib/graphql/types/v2/graphql';
import { i18nTransactionKind } from '../../lib/i18n/transaction';

import FormattedMoneyAmount from '../FormattedMoneyAmount';

type TransactionResultData = Pick<Transaction, 'id' | 'kind' | 'amount' | 'type' | 'account' | 'oppositeAccount'>;

export function TransactionResult({ transaction }: { transaction: TransactionResultData }) {
  const intl = useIntl();
  return (
    <div className="flex flex-1 items-center gap-2">
      <div
        className={clsx(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          transaction.type === 'DEBIT' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
        )}
      >
        {transaction.type === 'DEBIT' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
      </div>
      <div className="w-full min-w-0 overflow-hidden">
        <div className="flex justify-between gap-2">
          <div className="">{i18nTransactionKind(intl, transaction.kind)}</div>
          <span className="font-medium text-foreground">
            <FormattedMoneyAmount
              amount={transaction.amount.valueInCents}
              currency={transaction.amount.currency}
              showCurrencyCode={false}
            />
          </span>
        </div>

        <div className="overflow-hidden">
          <div className="truncate text-muted-foreground">
            <span className="text-foreground">{transaction.account.name}</span>{' '}
            {transaction.type === 'DEBIT' ? 'sent' : 'received'} transaction{' '}
            {transaction.type === 'DEBIT' ? 'to' : 'from'}{' '}
            <span className="text-foreground">{transaction.oppositeAccount.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

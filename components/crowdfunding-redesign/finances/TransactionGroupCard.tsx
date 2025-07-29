import React from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn } from '../../../lib/utils';

import Avatar from '../../Avatar';
import DateTime from '../../DateTime';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';

const getTransactionGroupDescription = group => {
  if (!group) {
    return null;
  }
  if (group.primaryTransaction.kind === 'CONTRIBUTION') {
    return (
      <div className="flex items-center gap-2">
        <span>Contribution {group.primaryTransaction.type === 'CREDIT' ? 'from' : 'to'}</span>
        <div className="flex items-center gap-2">
          <Avatar collective={group.primaryTransaction.oppositeAccount} radius={20} />
          {group.primaryTransaction.oppositeAccount.name}
        </div>
      </div>
    );
  }
  if (group.primaryTransaction.kind === 'EXPENSE') {
    return (
      <div className="flex items-center gap-2">
        <span>
          {group.primaryTransaction.type === 'CREDIT' ? 'Received payment for expense' : 'Paid expense'}{' '}
          {group.primaryTransaction.type === 'CREDIT' ? 'from' : 'to'}
        </span>
        <div className="flex items-center gap-2">
          <Avatar collective={group.primaryTransaction.oppositeAccount} radius={16} />
          {group.primaryTransaction.oppositeAccount.name}
        </div>
      </div>
    );
  }
  if (group.primaryTransaction.kind === 'BALANCE_TRANSFER') {
    return (
      <div className="flex items-center gap-2">
        <span>
          {group.primaryTransaction.type === 'CREDIT' ? 'Received' : 'Sent'} balance transfer{' '}
          {group.primaryTransaction.type === 'CREDIT' ? 'from' : 'to'}
        </span>
        <div className="flex items-center gap-2">
          <Avatar collective={group.primaryTransaction.oppositeAccount} radius={16} />
          {group.primaryTransaction.oppositeAccount.name}
        </div>
      </div>
    );
  }
  return group.primaryTransaction.type === 'CREDIT' ? 'Received' : 'Sent';
};
export function TransactionGroupCard({ group, className = undefined, asHero = false }) {
  return (
    <div className={cn('grid grid-cols-6 px-4 py-3', className)}>
      {!asHero && (
        <div className="flex items-center whitespace-nowrap text-muted-foreground">
          {group?.createdAt && <DateTime dateStyle="medium" value={group?.createdAt} />}
        </div>
      )}

      <div className={clsx(asHero ? 'col-span-5' : 'col-span-4', 'flex items-center gap-3 text-muted-foreground')}>
        <div
          className={clsx(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            group?.primaryTransaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100',
          )}
        >
          {group?.primaryTransaction.type === 'CREDIT' ? (
            <ArrowUpRight className="text-green-600" size={20} />
          ) : (
            <ArrowDownRight className="text-red-600" size={20} />
          )}
        </div>
        <div>{getTransactionGroupDescription(group)}</div>
      </div>
      <div
        className={clsx(
          'flex items-center justify-end text-right font-medium',
          group?.primaryTransaction.type === 'CREDIT' && 'text-green-600',
        )}
      >
        <FormattedMoneyAmount
          amount={group?.totalAmount.valueInCents}
          currency={group?.totalAmount.currency}
          showCurrencyCode={false}
        />
      </div>
    </div>
  );
}

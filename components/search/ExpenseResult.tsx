import React from 'react';
import { useIntl } from 'react-intl';

import { type Expense, ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../lib/i18n/expense';

import Avatar from '../Avatar';

type ExpenseResultData = Pick<Expense, 'description' | 'type' | 'account' | 'payee' | 'status'>;

export function ExpenseResult({ expense }: { expense: ExpenseResultData }) {
  const intl = useIntl();
  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar collective={expense.account} size={36} />

      <div className="overflow-hidden">
        <div className="truncate font-medium">{expense.description}</div>
        <div className="truncate text-muted-foreground">
          {i18nExpenseType(intl, expense.type)}
          {expense.type === ExpenseType.RECEIPT && ' request'} to{' '}
          <span className="text-foreground">{expense.account.name}</span> from{' '}
          <span className="text-foreground">{expense.payee.name}</span>
        </div>
      </div>
    </div>
  );
}

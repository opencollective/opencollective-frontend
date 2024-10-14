import React from 'react';

import FormattedMoneyAmount from '../FormattedMoneyAmount';

export function GoalDescription({ goal, account }) {
  return (
    <div className="space-y-3 rounded-xl bg-muted p-6 text-sm">
      <p className="font-medium">
        {account.name}&apos;s goal is to receive{' '}
        <FormattedMoneyAmount
          showCurrencyCode={false}
          amount={goal.amount * 100}
          precision={0}
          currency={account.currency}
        />{' '}
        {goal.type === 'MONTHLY' ? 'per month' : goal.type === 'YEARLY' ? 'per year' : null}
      </p>
      <p className="">{goal.description}</p>
    </div>
  );
}

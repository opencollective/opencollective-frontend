import React from 'react';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Progress } from '../ui/Progress';
import { cn } from '../../lib/utils';
import StackedAvatars from '../StackedAvatars';
import Avatar from '../Avatar';
import { GoalDescription } from './GoalDescription';

const getGoalProgress = (stats, goal) => {
  let currentAmount;
  switch (goal.type) {
    case 'YEARLY':
      currentAmount = stats.yearlyBudget.valueInCents;
      break;
    case 'MONTHLY':
      currentAmount = stats.yearlyBudget.valueInCents / 12;
      break;

    case 'FIXED':
      currentAmount = stats.totalAmountReceived.valueInCents;
      break;
  }
  return Math.floor((currentAmount / (goal.amount * 100)) * 100);
};

export function GoalProgress({ account, goal }) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <GoalProgressLabel account={account} goal={goal} className="text-base" />
      </div>
      <div className="space-y-4">
        <GoalProgressBar account={account} goal={goal} />
        <GoalContributors account={account} />
      </div>
    </div>
  );
}

export function GoalProgressBar({ account, goal }) {
  const goalProgress = getGoalProgress(account.stats, goal);
  return <Progress className="h-2" value={Math.min(goalProgress, 100)} />;
}

export function GoalProgressLabel({ account, goal, className }) {
  const goalProgress = getGoalProgress(account.stats, goal);
  return (
    <div className={cn('text-sm font-semibold', className)}>
      {goalProgress}% towards{' '}
      <FormattedMoneyAmount
        amount={goal.amount * 100}
        currency={account.currency}
        precision={0}
        showCurrencyCode={false}
      />
      {goal.type === 'MONTHLY' ? ' per month ' : goal.type === 'YEARLY' ? ' per year ' : ' '}goal
    </div>
  );
}

// Should be based on a future goal.contributors?
export function GoalContributors({ account }) {
  return (
    <div className="relative">
      <div className="flex items-center text-sm text-muted-foreground">
        {account.financialContributors.nodes.map((contributor, i) => (
          <Avatar
            key={contributor.id}
            style={{ zIndex: 1000 - i }}
            collective={contributor}
            radius={20}
            className="relative -ml-2 ring-2 ring-white first:ml-0"
          />
        ))}{' '}
        <span className="ml-3">
          {account.financialContributors.nodes[1].name} and{' '}
          {account.financialContributors.totalCount - account.financialContributors.nodes.length} others contribute to
          this goal
        </span>
      </div>
    </div>
  );
}

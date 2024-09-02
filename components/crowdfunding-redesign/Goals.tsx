import React from 'react';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StackedAvatars from '../StackedAvatars';
import { Progress } from '../ui/Progress';

import { aggregateGoalAmounts } from './helpers';

// Naive implementation of Goals for prototype
export function Goals({ account }) {
  if (!account) {
    return null;
  }
  const {
    stats,
    financialContributors,
    currency,
    settings: { goals },
  } = account;
  const hasYearlyGoal = goals?.find(g => g.type === 'yearlyBudget');
  const hasMonthlyGoal = goals?.find(g => g.type === 'monthlyBudget');
  const currentAmount = hasYearlyGoal
    ? stats.yearlyBudget.valueInCents
    : hasMonthlyGoal
      ? stats.yearlyBudget.valueInCents / 12
      : stats.totalAmountReceived.valueInCents;

  let goalTarget;
  if (hasYearlyGoal || hasMonthlyGoal) {
    goalTarget = aggregateGoalAmounts(goals);
  }
  const percentage = Math.round(goalTarget ? (currentAmount / goalTarget.amount) * 100 : 0);
  return (
    <div className="flex flex-col gap-4 text-muted-foreground">
      {goalTarget && <Progress value={percentage} />}
      <div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            {goalTarget ? (
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            ) : (
              <div>
                <span className="text-3xl font-bold text-primary">
                  <FormattedMoneyAmount
                    amount={currentAmount}
                    currency={currency}
                    showCurrencyCode={true}
                    precision={0}
                  />
                </span>
                <div className="">raised</div>
              </div>
            )}
          </div>
        </div>
        {goalTarget && (
          <div className="">
            towards{' '}
            <FormattedMoneyAmount
              amount={goalTarget.amount}
              currency={currency}
              showCurrencyCode={false}
              precision={0}
            />{' '}
            {hasYearlyGoal ? <span>per year</span> : hasMonthlyGoal && <span>per month</span>} goal
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold">{stats.contributorsCount}</div> <div>contributors</div>
      </div>
      <div>
        <StackedAvatars imageSize={32} accounts={financialContributors.nodes} maxDisplayedAvatars={6} />
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';

import dayjs from '../../lib/dayjs';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { cn } from '../../lib/utils';

import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Progress } from '../ui/Progress';

import { goalProgressQuery } from './queries';

const getGoalProgress = (stats, goal) => {
  if (!goal || !stats) {
    return null;
  }
  let currentAmount;

  if (!goal.recurrence) {
    currentAmount = stats.totalAmountReceived.valueInCents;
  } else {
    if (goal.continuous) {
      switch (goal.recurrence) {
        case 'YEARLY':
          currentAmount = stats.yearlyBudget.valueInCents;
          break;
        case 'MONTHLY':
          currentAmount = stats.yearlyBudget.valueInCents / 12;
          break;
      }
    } else {
      switch (goal.recurrence) {
        case 'YEARLY':
          currentAmount = stats.totalAmountReceivedThisYear.valueInCents;
          break;
        case 'MONTHLY':
          currentAmount = stats.totalAmountReceivedThisMonth.valueInCents;
          break;
      }
    }
  }
  return Math.floor((currentAmount / goal.amount.valueInCents) * 100);
};

function GoalProgressBar({ goal }) {
  return <Progress className="h-2" value={Math.min(goal.progress, 100)} />;
}

function GoalProgressLabel({ goal, className }) {
  if (!goal) {
    return null;
  }
  let goalDefinition;
  if (!goal.recurrence) {
    goalDefinition = 'goal';
  } else {
    if (goal.continuous) {
      switch (goal.recurrence) {
        case 'YEARLY':
          goalDefinition = 'yearly budget goal';
          break;
        case 'MONTHLY':
          goalDefinition = 'monthly budget goal';
          break;
      }
    } else {
      switch (goal.recurrence) {
        case 'YEARLY':
          goalDefinition = `goal for ${dayjs().format('YYYY')}`;
          break;
        case 'MONTHLY':
          goalDefinition = `goal for ${dayjs().format('MMMM')} ${dayjs().format('YYYY')}`;
          break;
      }
    }
  }

  return (
    <div className={cn('text-sm font-semibold', className)}>
      {goal.progress}% towards{' '}
      <FormattedMoneyAmount
        amount={goal.amount.valueInCents}
        currency={goal.amount.currency}
        precision={0}
        showCurrencyCode={false}
      />{' '}
      {goalDefinition}
    </div>
  );
}

function GoalContributors({ goal }) {
  if (!goal?.contributors?.totalCount) {
    return null;
  }
  const othersCount = goal.contributors.totalCount - goal.contributors.nodes.length;
  return (
    <div className="relative">
      <div className="flex items-center text-sm text-muted-foreground">
        {goal.contributors.nodes.map((contributor, i) => (
          <Avatar
            key={contributor.id}
            style={{ zIndex: 1000 - i }}
            collective={contributor}
            radius={20}
            className="relative -ml-2 ring-2 ring-white first:ml-0"
          />
        ))}{' '}
        <span className="ml-3">
          {goal.contributors.nodes[0].name} {othersCount > 0 && `and ${othersCount} others `}contribute to this goal
        </span>
      </div>
    </div>
  );
}

export function GoalProgress({ accountSlug, goal, editButton = undefined, className = undefined }) {
  const now = useMemo(() => dayjs().utc(), []);
  const { data } = useQuery(goalProgressQuery, {
    variables: {
      slug: accountSlug,
      oneYearAgo: now.subtract(1, 'year').toISOString(),
      thisMonthStart: now.startOf('month').toISOString(),
      thisYearStart: now.startOf('year').toISOString(),
      now: now.toISOString(),
    },
    context: API_V2_CONTEXT,
  });
  if (!goal?.amount) {
    return null;
  }

  let previewGoal = {
    amount: {
      valueInCents: Number(goal.amount) * 100,
      currency: data?.account.currency,
    },
    recurrence: goal.recurrence,
    continuous: goal.continuous,
    progress: 0,
    contributors: undefined,
  };
  previewGoal = {
    ...previewGoal,
    progress: getGoalProgress(data?.account.stats, previewGoal),
    contributors:
      (goal.recurrence === 'MONTHLY' || goal.recurrence === 'YEARLY') && goal.continuous
        ? data?.account.activeContributorsForBudgetGoal
        : goal.recurrence === 'MONTHLY'
          ? data?.account.activeContributorsForCalendarMonth
          : goal.recurrence === 'YEARLY'
            ? data?.account.activeContributorsForCalendarYear
            : data?.account.activeContributors,
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <GoalProgressLabel goal={previewGoal} className="text-base" />
        {editButton}
      </div>
      <div className="space-y-4">
        <GoalProgressBar goal={previewGoal} />
        <GoalContributors goal={previewGoal} />
      </div>
    </div>
  );
}

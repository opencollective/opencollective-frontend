import React from 'react';

import { cn } from '../../lib/utils';

import Avatar from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Progress } from '../ui/Progress';
import { GoalType } from '../../lib/graphql/types/v2/graphql';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';

const getGoalProgress = (stats, goal) => {
  if (!stats) return 0;
  let currentAmount;
  switch (goal.type) {
    case GoalType.ALL_TIME:
      currentAmount = stats.totalAmountReceived.valueInCents;
      break;
    case GoalType.MONTHLY_BUDGET:
      currentAmount = stats.yearlyBudget.valueInCents / 12;
      break;
    case GoalType.YEARLY_BUDGET:
      currentAmount = stats.yearlyBudget.valueInCents;
      break;
    case GoalType.CALENDAR_MONTH:
      currentAmount = stats.totalAmountReceivedThisMonth.valueInCents;
      break;
    case GoalType.CALENDAR_YEAR:
      currentAmount = stats.totalAmountReceivedThisYear.valueInCents;
      break;
  }

  return Math.floor((currentAmount / goal.amount.valueInCents) * 100);
};

export function Goal({ goal }) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <GoalProgressLabel goal={goal} className="text-base" />
      </div>
      <div className="space-y-4">
        <GoalProgressBar goal={goal} />
        <GoalContributors goal={goal} />
      </div>
    </div>
  );
}

const goalPreviewQuery = gql`
  query GoalPreview($slug: String!) {
    account(slug: $slug) {
      id
      slug
      type
      currency
      activeContributors(limit: 5) {
        totalCount
        limit
        nodes {
          id
          name
          slug
          type
          imageUrl
        }
      }
      activeContributorsForMonthlyBudget: activeContributors(
        includeActiveRecurringContributions: true
        dateFrom: "2024-02-01T00:00:00.000Z"
        limit: 5
      ) {
        totalCount
        limit
        nodes {
          id
          name
          slug
          type
          imageUrl
        }
      }
      activeContributorsForYearlyBudget: activeContributors(
        includeActiveRecurringContributions: true
        dateFrom: "2023-02-01T00:00:00.000Z"
        limit: 5
      ) {
        totalCount
        limit
        nodes {
          id
          name
          slug
          type
          imageUrl
        }
      }
      activeContributorsForCalendarYear: activeContributors(dateFrom: "2024-01-01T00:00:00.000Z", limit: 5) {
        totalCount
        limit
        nodes {
          id
          name
          slug
          type
          imageUrl
        }
      }
      activeContributorsForCalendarMonth: activeContributors(
        dateFrom: "2024-02-01T00:00:00.000Z"
        dateTo: "2024-03-01T00:00:00.000Z"
        limit: 5
      ) {
        totalCount
        limit
        nodes {
          id
          name
          slug
          type
          imageUrl
        }
      }
      stats {
        yearlyBudget {
          valueInCents
          currency
        }
        totalAmountReceived(net: true) {
          valueInCents
          currency
        }
        totalAmountReceivedThisMonth: totalAmountReceived(
          net: true
          dateFrom: "2024-02-01T00:00:00.000Z"
          dateTo: "2024-03-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
        totalAmountReceivedThisYear: totalAmountReceived(
          net: true
          dateFrom: "2024-01-01T00:00:00.000Z"
          dateTo: "2025-01-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
      }
      members(role: [BACKER], limit: 5) {
        totalCount
        limit
        nodes {
          id
          account {
            id
            name
            slug
            type
            imageUrl
          }
        }
      }
    }
  }
`;
export function GoalPreview({ account, goalInput }) {
  const { data, loading } = useQuery(goalPreviewQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  let previewGoal = {
    amount: {
      valueInCents: Number(goalInput.amount) * 100,
      currency: account.currency,
    },
    type: goalInput.type,
    progress: 0,
    contributors: undefined,
  };
  previewGoal = {
    ...previewGoal,
    progress: getGoalProgress(data?.account.stats, previewGoal),
    contributors:
      goalInput.type === GoalType.MONTHLY_BUDGET
        ? data?.account.activeContributorsForMonthlyBudget
        : goalInput.type === GoalType.YEARLY_BUDGET
          ? data?.account.activeContributorsForYearlyBudget
          : goalInput.type === GoalType.CALENDAR_MONTH
            ? data?.account.activeContributorsForCalendarMonth
            : goalInput.type === GoalType.CALENDAR_YEAR
              ? data?.account.activeContributorsForCalendarYear
              : data?.account.activeContributors,
  };

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <GoalProgressLabel goal={previewGoal} className="text-base" />
      </div>
      <div className="space-y-4">
        <GoalProgressBar goal={previewGoal} />
        <GoalContributors goal={previewGoal} />
      </div>
    </div>
  );
}

export function GoalProgressBar({ goal }) {
  return <Progress className="h-2" value={Math.min(goal.progress, 100)} />;
}

export function GoalProgressLabel({ goal, className }) {
  //   const goalProgress = getGoalProgress(account.stats, goal);
  return (
    <div className={cn('text-sm font-semibold', className)}>
      {goal.progress}% towards{' '}
      <FormattedMoneyAmount
        amount={goal.amount.valueInCents}
        currency={goal.amount.currency}
        precision={0}
        showCurrencyCode={false}
      />
      {goal.type === GoalType.MONTHLY_BUDGET
        ? ' monthly budget goal'
        : goal.type === GoalType.YEARLY_BUDGET
          ? ' yearly budget goal'
          : goal.type === GoalType.CALENDAR_MONTH
            ? ` goal for ${dayjs().format('MMMM')} ${dayjs().format('YYYY')} `
            : goal.type === GoalType.CALENDAR_YEAR
              ? ` goal for ${dayjs().format('YYYY')} `
              : ' goal'}
    </div>
  );
}

// Should be based on a future goal.contributors?
export function GoalContributors({ goal }) {
  if (!goal.contributors?.totalCount) {
    return null;
  }
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
          {goal.contributors.nodes[0].name} and {goal.contributors.totalCount - goal.contributors.nodes.length} others
          contribute to this goal
        </span>
      </div>
    </div>
  );
}

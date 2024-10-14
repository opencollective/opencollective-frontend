import React from 'react';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Progress } from '../ui/Progress';
import { cn } from '../../lib/utils';
import StackedAvatars from '../StackedAvatars';
import Avatar from '../Avatar';
import { GoalDescription } from './GoalDescription';
import dayjs from '../../lib/dayjs';
import { gql, useQuery } from '@apollo/client';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

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
  console.log({ currentAmount, goalAmount: goal.amount.valueInCents });
  return Math.floor((currentAmount / goal.amount.valueInCents) * 100);
};

export function GoalProgress({ account, goal }) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <GoalProgressLabel goal={goal} className="text-base" />
      </div>
      <div className="space-y-4">
        <GoalProgressBar account={account} goal={goal} />
        <GoalContributors account={account} />
      </div>
    </div>
  );
}

export function GoalProgressBar({ goal }) {
  return <Progress className="h-2" value={Math.min(goal.progress, 100)} />;
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

export function GoalPreview({ account, goalInput, editButton }) {
  if (!goalInput?.amount) return null;
  const { data, loading } = useQuery(goalPreviewQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  let previewGoal = {
    amount: {
      valueInCents: Number(goalInput.amount) * 100,
      currency: account.currency,
    },
    recurrence: goalInput.recurrence,
    continuous: goalInput.continuous,
    progress: 0,
    contributors: undefined,
  };
  previewGoal = {
    ...previewGoal,
    progress: getGoalProgress(data?.account.stats, previewGoal),
    contributors:
      goalInput.recurrence === 'MONTHLY' && goalInput.continuous
        ? data?.account.activeContributorsForMonthlyBudget
        : goalInput.recurrence === 'YEARLY' && goalInput.continuous
          ? data?.account.activeContributorsForYearlyBudget
          : goalInput.recurrence === 'MONTHLY'
            ? data?.account.activeContributorsForCalendarMonth
            : goalInput.recurrence === 'YEARLY'
              ? data?.account.activeContributorsForCalendarYear
              : data?.account.activeContributors,
  };
  console.log({ data, previewGoal });
  return (
    <div className="mb-8 space-y-3">
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

export function GoalProgressLabel({ goal, className }) {
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

export function GoalContributors({ goal }) {
  if (!goal?.contributors?.totalCount) {
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

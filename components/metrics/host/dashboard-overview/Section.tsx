import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessages, FormattedMessage } from 'react-intl';

import type {
  HostMetricsOverviewSectionQuery,
  HostMetricsOverviewSectionQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';

import { type HostedAccountType, type MonthPeriod, previousPeriod } from './helpers';
import { MetricCards } from './MetricCards';
import { MonthPicker } from './MonthPicker';
import { hostMetricsOverviewSectionQuery } from './queries';
import { TopList, type TopListRow } from './TopList';

const ROOT_TYPES: Record<HostedAccountType, string[]> = {
  COLLECTIVE: ['COLLECTIVE'],
  FUND: ['FUND'],
};

const messages = defineMessages({
  hostedCollectives: { defaultMessage: 'Hosted Collectives', id: 'HostedCollectives' },
  hostedFunds: { defaultMessage: 'Hosted Funds', id: 'HostedFunds' },
  topCollectivesByReceived: {
    defaultMessage: 'Top Collectives by Amount Received',
    id: 'i97izo',
  },
  topFundsByReceived: { defaultMessage: 'Top Funds by Amount Received', id: 'jFXTBS' },
  topCollectivesBySpent: { defaultMessage: 'Top Collectives by Amount Spent', id: 'TBxuUA' },
  topFundsBySpent: { defaultMessage: 'Top Funds by Amount Spent', id: 'us7tE9' },
});

type HostMetricsOverviewSectionProps = {
  hostSlug: string;
  category: HostedAccountType;
  period: MonthPeriod;
  onPeriodChange: (period: MonthPeriod) => void;
};

export function HostMetricsOverviewSection({
  hostSlug,
  category,
  period,
  onPeriodChange,
}: HostMetricsOverviewSectionProps) {
  const previous = previousPeriod(period);
  const variables = {
    hostSlug,
    currentRange: { from: period.from, to: period.to },
    previousRange: { from: previous.from, to: previous.to },
    financialFilters: { mainAccountType: { eq: category }, mainAccountIsArchived: false },
    membershipFilters: { accountType: { in: ROOT_TYPES[category] }, isArchived: false },
    hostingFilters: { accountType: { in: ROOT_TYPES[category] } },
  };

  const { data, loading, error } = useQuery<HostMetricsOverviewSectionQuery, HostMetricsOverviewSectionQueryVariables>(
    hostMetricsOverviewSectionQuery,
    {
      variables,
      fetchPolicy: 'cache-and-network',
    },
  );

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const m = data?.host?.metrics;
  const values = {
    activeCurrent: m?.currentActive?.rows?.[0]?.values?.activeCollectives ?? 0,
    activePrevious: m?.previousActive?.rows?.[0]?.values?.activeCollectives ?? 0,
    hostedCurrent: m?.currentHosted?.rows?.[0]?.values?.hostedCollectives ?? 0,
    hostedPrevious: m?.previousHosted?.rows?.[0]?.values?.hostedCollectives ?? 0,
    joinedCurrent: m?.currentMembership?.rows?.[0]?.values?.joinedDistinctCollectives ?? 0,
    joinedPrevious: m?.previousMembership?.rows?.[0]?.values?.joinedDistinctCollectives ?? 0,
    churnedCurrent: m?.currentMembership?.rows?.[0]?.values?.churnedDistinctCollectives ?? 0,
    churnedPrevious: m?.previousMembership?.rows?.[0]?.values?.churnedDistinctCollectives ?? 0,
  };

  const topByIncome: TopListRow[] | undefined = m?.topByIncome?.rows?.map(r => ({
    account: r.group?.account ?? null,
    amount: r.values?.amountReceived ?? null,
  }));
  const topBySpending: TopListRow[] | undefined = m?.topBySpending?.rows?.map(r => ({
    account: r.group?.account ?? null,
    amount: r.values?.amountSpent ?? null,
  }));

  const titleMessage = category === 'FUND' ? messages.hostedFunds : messages.hostedCollectives;

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          <FormattedMessage {...titleMessage} />
        </h2>
        <MonthPicker value={period} onChange={onPeriodChange} />
      </div>

      <MetricCards hostSlug={hostSlug} category={category} period={period} loading={loading} values={values} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopList
          hostSlug={hostSlug}
          category={category}
          title={
            <FormattedMessage
              {...(category === 'FUND' ? messages.topFundsByReceived : messages.topCollectivesByReceived)}
            />
          }
          rows={topByIncome}
          loading={loading}
        />
        <TopList
          hostSlug={hostSlug}
          category={category}
          title={
            <FormattedMessage {...(category === 'FUND' ? messages.topFundsBySpent : messages.topCollectivesBySpent)} />
          }
          rows={topBySpending}
          loading={loading}
        />
      </div>
    </div>
  );
}

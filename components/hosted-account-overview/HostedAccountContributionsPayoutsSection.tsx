import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import dayjs from '@/lib/dayjs';
import type {
  Amount,
  Currency,
  HostedAccountContributionTypesQuery,
  HostedAccountContributionTypesQueryVariables,
  HostedAccountFinancialActivityQuery,
  HostedAccountFinancialActivityQueryVariables,
  HostedAccountTransactionSizesQuery,
  HostedAccountTransactionSizesQueryVariables,
  TimeUnit,
} from '@/lib/graphql/types/v2/graphql';
import { HostedCollectivesTransactionSizesKindClass as KindClass } from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { Metric, type MetricChartView, type MetricViewMode } from '@/components/metrics';

import { AmountBandHistogram } from './AmountBandHistogram';
import { ContributionTypeDonut } from './ContributionTypeDonut';
import { bandHistogram, buildKindActivity, contributionTypeShares } from './financialActivity';
import { HostedAccountKindOverTimeChart } from './HostedAccountKindOverTimeChart';
import {
  hostedAccountContributionTypesQuery,
  hostedAccountFinancialActivityQuery,
  hostedAccountTransactionSizesQuery,
} from './queries';
import type { HostedAccountProfileData } from './types';

const CONTRIBUTIONS_COLOR = '#14b8a6';
const PAYOUTS_COLOR = '#dc2626';
const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';

type PeriodAmount = {
  current?: Amount | null;
  comparison?: Amount | null;
};

type PeriodCount = {
  current?: number | null;
  comparison?: number | null;
};

type HostedAccountContributionsPayoutsSectionProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
  dateFrom?: string;
  dateTo?: string;
  timeUnit: TimeUnit;
  received?: PeriodAmount | null;
  spent?: PeriodAmount | null;
  contributionsCount?: PeriodCount | null;
  statsLoading?: boolean;
};

export function HostedAccountContributionsPayoutsSection({
  account,
  hostSlug,
  dateFrom,
  dateTo,
  timeUnit,
  received,
  spent,
  contributionsCount,
  statsLoading,
}: HostedAccountContributionsPayoutsSectionProps) {
  const intl = useIntl();
  const contributionsLabel = intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' });
  const payoutsLabel = intl.formatMessage({ defaultMessage: 'Payouts', id: 'Payouts' });
  const dateRange = React.useMemo(
    () => ({ from: dateFrom ?? ALL_TIME_FROM, to: dateTo ?? dayjs.utc().toISOString() }),
    [dateFrom, dateTo],
  );

  const { data, loading, error } = useQuery<
    HostedAccountFinancialActivityQuery,
    HostedAccountFinancialActivityQueryVariables
  >(hostedAccountFinancialActivityQuery, {
    variables: {
      hostSlug,
      dateRange,
      timeUnit: timeUnit as HostedAccountFinancialActivityQueryVariables['timeUnit'],
      accountFilter: { mainAccount: { eq: { id: account?.id } } },
      groupByAccount: false,
    },
    skip: !account?.id || !hostSlug,
    fetchPolicy: 'cache-and-network',
  });

  const sizesQuery = useQuery<HostedAccountTransactionSizesQuery, HostedAccountTransactionSizesQueryVariables>(
    hostedAccountTransactionSizesQuery,
    {
      variables: {
        hostSlug,
        dateRange,
        accountFilter: { mainAccount: { eq: { id: account?.id } } },
      },
      skip: !account?.id || !hostSlug,
      fetchPolicy: 'cache-and-network',
    },
  );

  const typesQuery = useQuery<HostedAccountContributionTypesQuery, HostedAccountContributionTypesQueryVariables>(
    hostedAccountContributionTypesQuery,
    {
      variables: {
        hostSlug,
        dateRange,
        accountFilter: { mainAccount: { eq: { id: account?.id } } },
      },
      skip: !account?.id || !hostSlug,
      fetchPolicy: 'cache-and-network',
    },
  );

  const metrics = data?.host?.metrics;
  const currency = data?.host?.currency as Currency | undefined;
  const rows = React.useMemo(() => metrics?.consolidated?.rows ?? [], [metrics]);
  const sizeRows = React.useMemo(() => sizesQuery.data?.host?.metrics?.transactionSizes?.rows ?? [], [sizesQuery.data]);
  const contributionsHistogram = React.useMemo(() => bandHistogram(sizeRows, KindClass.CONTRIBUTION), [sizeRows]);
  const payoutsHistogram = React.useMemo(() => bandHistogram(sizeRows, KindClass.PAYOUT), [sizeRows]);
  const typeShares = React.useMemo(
    () => contributionTypeShares(typesQuery.data?.host?.metrics?.contributionTypes?.rows ?? []),
    [typesQuery.data],
  );

  const contributions = React.useMemo(
    () =>
      buildKindActivity(rows, {
        amountMeasure: 'amountReceived',
        countMeasure: 'contributionsCount',
        timeUnit,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        currency,
      }),
    [rows, dateRange, currency, timeUnit],
  );
  const payouts = React.useMemo(
    () =>
      buildKindActivity(rows, {
        amountMeasure: 'amountSpent',
        countMeasure: 'payoutsCount',
        timeUnit,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        currency,
      }),
    [rows, dateRange, currency, timeUnit],
  );

  const chartsLoading = (loading && !data) || (sizesQuery.loading && !sizesQuery.data);
  const contributionsViews: MetricChartView[] = React.useMemo(
    () => [
      {
        id: 'overtime',
        label: <FormattedMessage defaultMessage="Over time" id="ruPkNJ" />,
        chart: (mode: MetricViewMode) => (
          <HostedAccountKindOverTimeChart
            timeSeries={contributions.timeSeries}
            color={CONTRIBUTIONS_COLOR}
            currency={contributions.currency}
            mode={mode}
          />
        ),
      },
      {
        id: 'size',
        label: <FormattedMessage defaultMessage="By size" id="bSHoiI" />,
        chart: (
          <AmountBandHistogram
            bars={contributionsHistogram}
            color={CONTRIBUTIONS_COLOR}
            currency={contributions.currency}
            kindLabel={contributionsLabel}
          />
        ),
      },
      {
        id: 'type',
        label: <FormattedMessage defaultMessage="By type" id="j/wRjH" />,
        chart: (mode: MetricViewMode) => (
          <ContributionTypeDonut shares={typeShares} currency={contributions.currency} mode={mode} />
        ),
      },
    ],
    [contributions, contributionsHistogram, contributionsLabel, typeShares],
  );
  const payoutsViews: MetricChartView[] = React.useMemo(
    () => [
      {
        id: 'overtime',
        label: <FormattedMessage defaultMessage="Over time" id="ruPkNJ" />,
        chart: (mode: MetricViewMode) => (
          <HostedAccountKindOverTimeChart
            timeSeries={payouts.timeSeries}
            color={PAYOUTS_COLOR}
            currency={payouts.currency}
            mode={mode}
          />
        ),
      },
      {
        id: 'size',
        label: <FormattedMessage defaultMessage="By size" id="bSHoiI" />,
        chart: (
          <AmountBandHistogram
            bars={payoutsHistogram}
            color={PAYOUTS_COLOR}
            currency={payouts.currency}
            kindLabel={payoutsLabel}
          />
        ),
      },
    ],
    [payouts, payoutsHistogram, payoutsLabel],
  );

  // `metrics` is null (not undefined) when the viewer is not a host admin — nothing to show.
  if (data?.host && metrics === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Metric
            label={<FormattedMessage defaultMessage="Contributions" id="Contributions" />}
            helpLabel={
              <FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />
            }
            amount={received?.current ? { current: received.current, comparison: received.comparison } : undefined}
            count={
              contributionsCount?.current !== null && contributionsCount?.current !== undefined
                ? { current: contributionsCount.current, comparison: contributionsCount.comparison ?? undefined }
                : undefined
            }
            loading={statsLoading || chartsLoading}
            chartViews={contributionsViews}
            defaultChartView="overtime"
            color={CONTRIBUTIONS_COLOR}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Payouts" id="Payouts" />}
            helpLabel={<FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />}
            amount={spent?.current ? { current: spent.current, comparison: spent.comparison } : undefined}
            count={payouts.totalCount ? { current: payouts.totalCount } : undefined}
            useAbsoluteAmount
            loading={statsLoading || chartsLoading}
            chartViews={payoutsViews}
            defaultChartView="overtime"
            color={PAYOUTS_COLOR}
          />
        </div>
      )}
    </div>
  );
}

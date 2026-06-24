import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import dayjs from '@/lib/dayjs';
import type {
  Currency,
  HostedAccountContributionTypesQuery,
  HostedAccountContributionTypesQueryVariables,
  HostedAccountFinancialActivityQuery,
  HostedAccountFinancialActivityQueryVariables,
  HostedAccountTransactionSizesQuery,
  HostedAccountTransactionSizesQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { bandHistogram, buildKindActivity, contributionTypeShares } from './financialActivity';
import { HostedAccountKindActivityCard } from './HostedAccountKindActivityCard';
import {
  hostedAccountContributionTypesQuery,
  hostedAccountFinancialActivityQuery,
  hostedAccountTransactionSizesQuery,
} from './queries';
import type { HostedAccountProfileData } from './types';

const CONTRIBUTIONS_COLOR = '#14b8a6';
const PAYOUTS_COLOR = '#dc2626';
// All-time, monthly. "From" is intentionally well before Open Collective existed; the over-time
// chart trims leading empty months so it starts at the account's first activity.
const TIME_UNIT = 'MONTH';
const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';

type HostedAccountContributionsPayoutsSectionProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
};

export function HostedAccountContributionsPayoutsSection({
  account,
  hostSlug,
}: HostedAccountContributionsPayoutsSectionProps) {
  const dateRange = React.useMemo(() => ({ from: ALL_TIME_FROM, to: dayjs.utc().toISOString() }), []);

  const { data, loading, error } = useQuery<
    HostedAccountFinancialActivityQuery,
    HostedAccountFinancialActivityQueryVariables
  >(hostedAccountFinancialActivityQuery, {
    variables: {
      hostSlug,
      dateRange,
      timeUnit: TIME_UNIT as HostedAccountFinancialActivityQueryVariables['timeUnit'],
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
  const contributionsHistogram = React.useMemo(() => bandHistogram(sizeRows, 'CONTRIBUTION'), [sizeRows]);
  const payoutsHistogram = React.useMemo(() => bandHistogram(sizeRows, 'PAYOUT'), [sizeRows]);
  const typeShares = React.useMemo(
    () => contributionTypeShares(typesQuery.data?.host?.metrics?.contributionTypes?.rows ?? []),
    [typesQuery.data],
  );

  const contributions = React.useMemo(
    () =>
      buildKindActivity(rows, {
        amountMeasure: 'amountReceived',
        countMeasure: 'contributionsCount',
        timeUnit: TIME_UNIT,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        currency,
      }),
    [rows, dateRange, currency],
  );
  const payouts = React.useMemo(
    () =>
      buildKindActivity(rows, {
        amountMeasure: 'amountSpent',
        countMeasure: 'payoutsCount',
        timeUnit: TIME_UNIT,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        currency,
      }),
    [rows, dateRange, currency],
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
          <HostedAccountKindActivityCard
            title={<FormattedMessage defaultMessage="Contributions" id="Contributions" />}
            color={CONTRIBUTIONS_COLOR}
            activity={contributions}
            histogram={contributionsHistogram}
            typeShares={typeShares}
            loading={loading && !data}
          />
          <HostedAccountKindActivityCard
            title={<FormattedMessage defaultMessage="Payouts" id="Payouts" />}
            color={PAYOUTS_COLOR}
            activity={payouts}
            histogram={payoutsHistogram}
            loading={loading && !data}
          />
        </div>
      )}
    </div>
  );
}

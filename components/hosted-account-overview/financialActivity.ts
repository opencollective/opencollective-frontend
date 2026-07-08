import dayjs from '@/lib/dayjs';
import type {
  Currency,
  HostedAccountContributionTypesQuery,
  HostedAccountFinancialActivityQuery,
  HostedAccountTransactionSizesQuery,
  HostedCollectivesTransactionSizesKindClass as KindClass,
  TimeSeriesAmount,
} from '@/lib/graphql/types/v2/graphql';
import {
  HostedCollectivesFinancialActivityContributionFrequency as ContributionFrequency,
  HostedCollectivesTransactionSizesAmountBand as AmountBand,
} from '@/lib/graphql/types/v2/graphql';

type Metrics = NonNullable<NonNullable<HostedAccountFinancialActivityQuery['host']>['metrics']>;
type ConsolidatedRow = Metrics['consolidated']['rows'][number];

export type KindActivity = {
  timeSeries: TimeSeriesAmount;
  totalAmount: number;
  totalCount: number;
  currency?: Currency;
};

export function buildKindActivity(
  rows: ReadonlyArray<ConsolidatedRow>,
  opts: {
    amountMeasure: 'amountReceived' | 'amountSpent';
    countMeasure: 'contributionsCount' | 'payoutsCount';
    timeUnit: string;
    dateFrom: string;
    dateTo: string;
    currency?: Currency;
  },
): KindActivity {
  let totalAmount = 0;
  let totalCount = 0;
  const nodes = rows
    .filter(row => row.bucket)
    .map(row => {
      const amount = row.values?.[opts.amountMeasure];
      const valueInCents = Math.abs(amount?.valueInCents ?? 0);
      const count = Number(row.values?.[opts.countMeasure] ?? 0);
      totalAmount += valueInCents;
      totalCount += count;
      return {
        date: dayjs.utc(row.bucket).toISOString(),
        amount: { valueInCents, currency: opts.currency },
        count,
      };
    });

  return {
    timeSeries: {
      __typename: 'TimeSeriesAmount',
      timeUnit: opts.timeUnit,
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
      nodes,
    } as unknown as TimeSeriesAmount,
    totalAmount,
    totalCount,
    currency: opts.currency,
  };
}

export function toCountSeries(timeSeries: TimeSeriesAmount): TimeSeriesAmount {
  return {
    ...timeSeries,
    nodes: timeSeries.nodes.map(node => ({ ...node, amount: undefined })),
  } as unknown as TimeSeriesAmount;
}

type SizesMetrics = NonNullable<NonNullable<HostedAccountTransactionSizesQuery['host']>['metrics']>;
type SizeRow = SizesMetrics['transactionSizes']['rows'][number];

/**
 * Parse both of an amount-band token's bounds (currency units). Tokens are fully self-describing:
 * `GT_<lower>_LTE_<upper>` is a closed band; `GT_<lower>` is the open-ended overflow (upper ∞).
 */
function bandBounds(token: AmountBand): { lowerBound: number; upperBound: number } {
  const closed = /^GT_(\d+)_LTE_(\d+)$/.exec(token);
  if (closed) {
    return { lowerBound: Number(closed[1]), upperBound: Number(closed[2]) };
  }
  const overflow = /^GT_(\d+)$/.exec(token);
  return { lowerBound: overflow ? Number(overflow[1]) : 0, upperBound: Number.POSITIVE_INFINITY };
}

export const ORDERED_AMOUNT_BANDS: { token: AmountBand; lowerBound: number; upperBound: number }[] = Object.values(
  AmountBand,
)
  .map(token => ({ token, ...bandBounds(token) }))
  .sort((a, b) => a.upperBound - b.upperBound);

export type HistogramBar = { token: AmountBand; lowerBound: number; upperBound: number; count: number; amount: number };

export function bandHistogram(rows: ReadonlyArray<SizeRow>, kindClass: KindClass): HistogramBar[] {
  const counts = new Map<string, number>();
  const amounts = new Map<string, number>();
  for (const row of rows) {
    const token = row.group?.amountBand;
    if (!token || row.group?.kindClass !== kindClass) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + Number(row.values?.transactionCount ?? 0));
    amounts.set(token, (amounts.get(token) ?? 0) + Math.abs(row.values?.amount?.valueInCents ?? 0));
  }
  return ORDERED_AMOUNT_BANDS.map(band => ({
    ...band,
    count: counts.get(band.token) ?? 0,
    amount: amounts.get(band.token) ?? 0,
  }));
}

type TypesMetrics = NonNullable<NonNullable<HostedAccountContributionTypesQuery['host']>['metrics']>;
type TypeRow = TypesMetrics['contributionTypes']['rows'][number];

const CONTRIBUTION_FREQUENCIES = [
  { key: ContributionFrequency.ONE_TIME, color: '#14b8a6' },
  { key: ContributionFrequency.RECURRING, color: '#6366f1' },
  { key: ContributionFrequency.ADDED_FUNDS, color: '#f59e0b' },
] as const;

export type FrequencyKey = (typeof CONTRIBUTION_FREQUENCIES)[number]['key'];

export type ContributionTypeShare = { key: FrequencyKey; color: string; amount: number; count: number };

export function contributionTypeShares(rows: ReadonlyArray<TypeRow>): ContributionTypeShare[] {
  return CONTRIBUTION_FREQUENCIES.map(({ key, color }) => {
    let amount = 0;
    let count = 0;
    for (const row of rows) {
      if (row.group?.contributionFrequency !== key) {
        continue;
      }
      amount += Math.abs((row.values?.amountReceived?.valueInCents ?? 0) / 100);
      count += Number(row.values?.contributionsCount ?? 0);
    }
    return { key, color, amount, count };
  });
}

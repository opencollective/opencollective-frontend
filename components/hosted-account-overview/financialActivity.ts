import dayjs from '@/lib/dayjs';
import type {
  Currency,
  HostedAccountContributionTypesQuery,
  HostedAccountFinancialActivityQuery,
  HostedAccountTransactionSizesQuery,
  TimeSeriesAmount,
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

const BAND_LABELS = [
  '0 – 5',
  '5 – 10',
  '10 – 25',
  '25 – 50',
  '50 – 75',
  '75 – 100',
  '100 – 150',
  '150 – 200',
  '200 – 250',
  '250 – 500',
  '500 – 1k',
  '1k – 2k',
  '2k – 5k',
  '5k – 10k',
  '10k – 25k',
  '25k – 50k',
  '> 50k',
];

type SizesMetrics = NonNullable<NonNullable<HostedAccountTransactionSizesQuery['host']>['metrics']>;
type SizeRow = SizesMetrics['transactionSizes']['rows'][number];

export type HistogramBar = { band: string; count: number; amount: number };

/** Bucket the size rows for one kind into an ordered, gap-free array (one entry per band). */
export function bandHistogram(rows: ReadonlyArray<SizeRow>, kindClass: 'CONTRIBUTION' | 'PAYOUT'): HistogramBar[] {
  const counts = new Array(BAND_LABELS.length).fill(0);
  const amounts = new Array(BAND_LABELS.length).fill(0);
  for (const row of rows) {
    const index = row.group?.amountBandIndex;
    if (row.group?.kindClass !== kindClass || index === null || index === undefined) {
      continue;
    }
    counts[index] += Number(row.values?.transactionCount ?? 0);
    amounts[index] += Math.abs(row.values?.amount?.valueInCents ?? 0);
  }
  return BAND_LABELS.map((band, i) => ({ band, count: counts[i], amount: amounts[i] }));
}

type TypesMetrics = NonNullable<NonNullable<HostedAccountContributionTypesQuery['host']>['metrics']>;
type TypeRow = TypesMetrics['contributionTypes']['rows'][number];

const CONTRIBUTION_FREQUENCIES = [
  { key: 'ONE_TIME', color: '#14b8a6' },
  { key: 'RECURRING', color: '#6366f1' },
  { key: 'ADDED_FUNDS', color: '#f59e0b' },
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

import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import { flatten, uniq } from 'lodash-es';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatAmountForLegend } from '@/lib/charts';
import dayjs from '@/lib/dayjs';
import type { Currency, TimeSeriesAmount } from '@/lib/graphql/types/v2/graphql';

import MessageBox from '@/components/MessageBox';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type OverviewChartSeries = { name: string; color: string; data?: TimeSeriesAmount | null };

const monthKey = (date: string) => dayjs.utc(date).format('YYYY-MM');
const monthLabel = (key: string) => dayjs.utc(`${key}-01`).format('MMM YYYY');

function Chart({ series, currency }: { series: OverviewChartSeries[]; currency?: Currency }) {
  const intl = useIntl();

  const indexed = series
    .filter(s => s.data?.nodes?.length)
    .map(s => {
      const byMonth = new Map<string, number>();
      for (const node of s.data.nodes) {
        byMonth.set(monthKey(node.date), Math.abs((node.amount?.valueInCents ?? 0) / 100));
      }
      return { name: s.name, color: s.color, byMonth };
    });

  let months = uniq(flatten(indexed.map(s => Array.from(s.byMonth.keys())))).sort();
  // Trim leading months where every series is empty, so an all-time window starts at first activity.
  let start = 0;
  while (start < months.length - 1 && indexed.every(s => (s.byMonth.get(months[start]) ?? 0) === 0)) {
    start++;
  }
  months = months.slice(start);

  const apexSeries = indexed.map(s => ({
    name: s.name,
    color: s.color,
    data: months.map((key, i) => ({ x: i, y: s.byMonth.get(key) ?? 0 })),
  }));

  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: 'hsl(var(--muted-foreground))',
    },
    legend: { show: true, position: 'bottom', horizontalAlign: 'center', markers: { size: 6 } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    grid: { show: true, borderColor: 'hsl(var(--border))', strokeDashArray: 4 },
    xaxis: {
      type: 'numeric',
      tickAmount: 6,
      axisTicks: { show: true },
      tooltip: { enabled: false },
      labels: {
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: value => {
          const key = months[Math.round(Number(value))];
          return key ? monthLabel(key) : '';
        },
      },
    },
    yaxis: {
      min: 0,
      labels: { formatter: value => (currency ? formatAmountForLegend(value, currency, intl.locale) : String(value)) },
    },
    tooltip: {
      x: { show: false },
      y: {
        title: {
          formatter: (_seriesName, { dataPointIndex }) => {
            const key = months[dataPointIndex];
            return key ? monthLabel(key) : '';
          },
        },
      },
    },
  };

  return <ApexChart type="line" width="100%" height="100%" options={options} series={apexSeries} />;
}

export function HostedAccountOverviewChart({
  series,
  currency,
}: {
  series: OverviewChartSeries[];
  currency?: Currency;
}) {
  if (!series.some(s => s.data?.nodes?.length)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="No data" id="UG5qoS" />
      </div>
    );
  }
  return (
    <ErrorBoundary fallback={({ error }) => <MessageBox type="error">{error['message']}</MessageBox>}>
      <Chart series={series} currency={currency} />
    </ErrorBoundary>
  );
}

import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatAmountForLegend, formatDateLabel, formatSeriesData, setDatesIfMissing } from '@/lib/charts';
import dayjs from '@/lib/dayjs';
import type { Currency, TimeSeriesAmount } from '@/lib/graphql/types/v2/graphql';

import MessageBox from '@/components/MessageBox';

import { renderChartTooltip } from './chartTooltip';
import { toCountSeries } from './financialActivity';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const COUNT_COLOR = '#94a3b8';

type HostedAccountKindOverTimeChartProps = {
  timeSeries: TimeSeriesAmount;
  color: string;
  currency?: Currency;
};

function Chart({ timeSeries, color, currency }: HostedAccountKindOverTimeChartProps) {
  const intl = useIntl();
  const amountName = intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' });
  const countName = intl.formatMessage({ defaultMessage: 'Count', id: 'Count' });

  const ts = setDatesIfMissing(timeSeries);
  const amount = formatSeriesData(ts);
  const count = formatSeriesData(toCountSeries(ts));

  // Trim leading all-zero buckets so an all-time range starts at the first month with activity.
  let start = 0;
  while (start < amount.length - 1 && (amount[start]?.y ?? 0) === 0 && (count[start]?.y ?? 0) === 0) {
    start++;
  }
  const unit = (ts.timeUnit || 'MONTH').toLowerCase() as dayjs.ManipulateType;
  const startDate = dayjs.utc(ts.dateFrom).add(start, unit).toISOString();
  const amountData = amount.slice(start).map((p, i) => ({ x: i, y: p.y }));
  const countData = count.slice(start).map((p, i) => ({ x: i, y: p.y }));

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: 'hsl(var(--muted-foreground))',
    },
    colors: [color, COUNT_COLOR],
    stroke: { curve: 'smooth', width: 2 },
    legend: { show: true, position: 'bottom', horizontalAlign: 'center', markers: { size: 6 } },
    dataLabels: { enabled: false },
    grid: { show: true, borderColor: 'hsl(var(--border))', strokeDashArray: 4 },
    xaxis: {
      type: 'numeric',
      tickAmount: 6,
      axisTicks: { show: true },
      tooltip: { enabled: false },
      labels: {
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: true,
        formatter: value =>
          ts.timeUnit === 'MONTH'
            ? dayjs.utc(startDate).add(Number(value), 'month').format('MMM YY')
            : formatDateLabel({ startDate, index: Number(value), timeUnit: ts.timeUnit }),
      },
    },
    yaxis: [
      {
        seriesName: amountName,
        min: 0,
        title: { text: amountName },
        labels: {
          formatter: value => (currency ? formatAmountForLegend(value, currency, intl.locale) : String(value)),
        },
      },
      {
        seriesName: countName,
        opposite: true,
        min: 0,
        title: { text: countName },
        labels: { formatter: value => String(Math.round(value)) },
      },
    ],
    tooltip: {
      custom: ({ dataPointIndex }) =>
        renderChartTooltip({
          title: formatDateLabel({ startDate, index: dataPointIndex, timeUnit: ts.timeUnit }),
          items: [
            {
              label: amountName,
              color,
              value: currency
                ? formatAmountForLegend(amountData[dataPointIndex]?.y ?? 0, currency, intl.locale, false)
                : String(amountData[dataPointIndex]?.y ?? 0),
            },
            { label: countName, color: COUNT_COLOR, value: intl.formatNumber(countData[dataPointIndex]?.y ?? 0) },
          ],
        }),
    },
  };

  return (
    <ApexChart
      type="line"
      width="100%"
      height="100%"
      options={options}
      series={[
        { name: amountName, data: amountData },
        { name: countName, data: countData },
      ]}
    />
  );
}

export function HostedAccountKindOverTimeChart(props: HostedAccountKindOverTimeChartProps) {
  if (!props.timeSeries?.nodes?.some(n => n.amount?.valueInCents || n.count)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="No data" id="UG5qoS" />
      </div>
    );
  }
  return (
    <ErrorBoundary fallback={({ error }) => <MessageBox type="error">{error['message']}</MessageBox>}>
      <Chart {...props} />
    </ErrorBoundary>
  );
}

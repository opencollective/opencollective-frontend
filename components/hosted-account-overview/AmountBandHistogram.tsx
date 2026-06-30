import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';

import { formatAmountForLegend } from '@/lib/charts';
import type { Currency } from '@/lib/graphql/types/v2/graphql';

import MessageBox from '@/components/MessageBox';

import { renderChartTooltip } from './chartTooltip';
import type { HistogramBar } from './financialActivity';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const AMOUNT_LINE_COLOR = '#94a3b8';

type AmountBandHistogramProps = {
  bars: HistogramBar[];
  color: string;
  currency?: Currency;
  kindLabel?: string;
};

function bandLabel(bar: HistogramBar, currency: Currency | undefined, locale: string): string {
  const fmt = (value: number) => (currency ? formatAmountForLegend(value, currency, locale) : String(value));
  if (!Number.isFinite(bar.upperBound)) {
    return `> ${fmt(bar.lowerBound)}`;
  }
  if (bar.lowerBound === 0) {
    return `≤ ${fmt(bar.upperBound)}`;
  }
  return `${fmt(bar.lowerBound)} – ${fmt(bar.upperBound)}`;
}

function Chart({ bars, color, currency, kindLabel }: AmountBandHistogramProps) {
  const intl = useIntl();
  const countName = intl.formatMessage({ defaultMessage: 'Count', id: 'Count' });
  const amountName = intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' });
  const totalAmountName = intl.formatMessage({ defaultMessage: 'Total amount', id: 'TotalAmount' });

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: 'hsl(var(--muted-foreground))',
    },
    colors: [color, AMOUNT_LINE_COLOR],
    legend: { show: true, position: 'bottom', horizontalAlign: 'center', markers: { size: 6 } },
    plotOptions: { bar: { columnWidth: '70%', borderRadius: 2 } },
    stroke: { width: [0, 3], curve: 'smooth' },
    markers: { size: 0 },
    dataLabels: { enabled: false },
    grid: { show: true, borderColor: 'hsl(var(--border))', strokeDashArray: 4 },
    xaxis: {
      categories: bars.map(b => bandLabel(b, currency, intl.locale)),
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
        style: { fontSize: '9px' },
      },
    },
    yaxis: [
      {
        seriesName: countName,
        min: 0,
        title: { text: countName },
        labels: { formatter: value => String(Math.round(value)) },
      },
      {
        seriesName: amountName,
        opposite: true,
        min: 0,
        title: { text: amountName },
        labels: {
          formatter: value => (currency ? formatAmountForLegend(value, currency, intl.locale) : String(value)),
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ dataPointIndex }) => {
        const bar = bars[dataPointIndex];
        return renderChartTooltip({
          title: bandLabel(bar, currency, intl.locale),
          subtitle: kindLabel,
          items: [
            { label: countName, value: intl.formatNumber(bar.count) },
            {
              label: totalAmountName,
              value: currency
                ? formatAmountForLegend(bar.amount / 100, currency, intl.locale, false)
                : String(bar.amount / 100),
            },
          ],
        });
      },
    },
  };

  return (
    <ApexChart
      type="line"
      width="100%"
      height="100%"
      options={options}
      series={[
        { name: countName, type: 'column', data: bars.map(b => b.count) },
        { name: amountName, type: 'line', data: bars.map(b => Math.round(b.amount / 100)) },
      ]}
    />
  );
}

export function AmountBandHistogram(props: AmountBandHistogramProps) {
  if (!props.bars.some(b => b.count !== 0)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <FormattedMessageNoData />
      </div>
    );
  }
  return (
    <ErrorBoundary fallback={({ error }) => <MessageBox type="error">{error['message']}</MessageBox>}>
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function FormattedMessageNoData() {
  const { formatMessage } = useIntl();
  return <span>{formatMessage({ defaultMessage: 'No data', id: 'UG5qoS' })}</span>;
}

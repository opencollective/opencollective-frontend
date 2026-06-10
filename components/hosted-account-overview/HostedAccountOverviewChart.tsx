import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatAmountForLegend, formatDateLabel, formatSeriesData, setDatesIfMissing } from '@/lib/charts';
import type { Currency, TimeSeriesAmount } from '@/lib/graphql/types/v2/graphql';

import MessageBox from '@/components/MessageBox';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type OverviewChartSeries = { name: string; color: string; data?: TimeSeriesAmount | null };

function Chart({ series, currency }: { series: OverviewChartSeries[]; currency?: Currency }) {
  const intl = useIntl();

  const withData = series.filter(s => s.data?.nodes?.length);
  const normalized = withData.map(s => ({ ...s, data: setDatesIfMissing(s.data) }));
  const timeUnit = normalized[0]?.data?.timeUnit;

  const apexSeries = normalized.map(s => ({
    name: s.name,
    color: s.color,
    data: formatSeriesData(s.data),
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
        formatter: value =>
          formatDateLabel({ startDate: normalized[0]?.data?.dateFrom, index: Number(value), timeUnit }),
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
          formatter: (seriesName, { dataPointIndex }) => {
            const s = normalized.find(x => x.name === seriesName);
            return formatDateLabel({
              startDate: s?.data?.dateFrom,
              index: dataPointIndex,
              timeUnit: s?.data?.timeUnit,
            });
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

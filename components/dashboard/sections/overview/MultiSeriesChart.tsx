import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import { isNil } from 'lodash';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';

import { formatAmountForLegend, formatDateLabel, formatSeriesData, setDatesIfMissing } from '../../../../lib/charts';
import type { Currency, TimeSeriesAmount } from '../../../../lib/graphql/types/v2/graphql';

import MessageBox from '../../../MessageBox';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const DEFAULT_COLORS = [
  '#1d4ed8', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#be185d', // pink
  '#4f46e5', // indigo
  '#059669', // emerald
];

export interface MultiSeriesEntry {
  label: string;
  timeseries: TimeSeriesAmount;
}

export interface MultiSeriesChartProps {
  series: MultiSeriesEntry[];
  colors?: string[];
  currency?: Currency;
  expanded?: boolean;
}

const makeApexOptions = ({
  currency,
  timeUnit,
  dateFrom,
  intl,
  expanded,
  seriesEntries,
}: {
  currency?: Currency;
  timeUnit: string;
  dateFrom: string;
  intl: ReturnType<typeof useIntl>;
  expanded?: boolean;
  seriesEntries: MultiSeriesEntry[];
}): ApexOptions => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    offsetX: 0,
    offsetY: 0,
    parentHeightOffset: 0,
    sparkline: {
      enabled: !expanded,
    },
    foreColor: 'hsl(var(--muted-foreground))',
    fontFamily: 'Inter, sans-serif',
  },
  legend: {
    show: expanded,
    position: 'bottom',
    horizontalAlign: 'left',
  },
  grid: {
    show: false,
    borderColor: '#90A4AE',
    strokeDashArray: 0,
    position: 'back',
    xaxis: {
      lines: {
        show: expanded,
      },
    },
    yaxis: {
      lines: {
        show: expanded,
      },
    },
    padding: {
      top: 4,
      right: expanded ? 10 : 2,
      bottom: expanded ? 10 : 2,
      left: expanded ? 10 : 2,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  markers: {
    size: 0,
    strokeColors: '#fff',
    strokeWidth: expanded ? 2 : 0,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    shape: 'circle',
    offsetX: 0,
    offsetY: 0,
    showNullDataPoints: true,
    hover: {
      size: undefined,
      sizeOffset: expanded ? 4 : 0,
    },
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    axisTicks: {
      show: expanded && ['YEAR', 'MONTH'].includes(timeUnit),
    },
    tooltip: {
      enabled: false,
    },
    labels: {
      show: expanded && ['YEAR', 'MONTH'].includes(timeUnit),
      formatter: value => {
        return formatDateLabel({ startDate: dateFrom, index: Number(value), timeUnit });
      },
    },
  },
  yaxis: {
    min: 0,
    labels: {
      show: expanded,
      formatter: (value): string =>
        isNil(value)
          ? intl.formatMessage({ defaultMessage: 'No data', id: 'UG5qoS' })
          : !currency
            ? String(value)
            : formatAmountForLegend(value, currency, intl.locale),
    },
  },
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: (seriesName: string, { dataPointIndex }) => {
          const entry = seriesEntries.find(e => e.label === seriesName);
          const startDate = entry ? setDatesIfMissing(entry.timeseries).dateFrom : dateFrom;
          return formatDateLabel({ startDate, index: dataPointIndex, timeUnit });
        },
      },
    },
  },
});

const buildSeries = ({
  entries,
  colors,
}: {
  entries: { label: string; timeseries: TimeSeriesAmount }[];
  colors: string[];
}): ApexOptions['series'] => {
  return entries.map((entry, index) => {
    const ts = setDatesIfMissing(entry.timeseries);
    return {
      name: entry.label,
      data: formatSeriesData({ ...ts }),
      color: colors[index % colors.length],
      zIndex: entries.length - index,
    };
  });
};

function Chart({ series: seriesEntries, colors = DEFAULT_COLORS, expanded, currency }: MultiSeriesChartProps) {
  const intl = useIntl();

  // Use the first series to derive shared timeUnit and dateFrom
  const firstTimeseries = React.useMemo(() => setDatesIfMissing(seriesEntries[0].timeseries), [seriesEntries]);

  const apexSeries = React.useMemo(() => buildSeries({ entries: seriesEntries, colors }), [seriesEntries, colors]);

  const options = makeApexOptions({
    currency,
    timeUnit: firstTimeseries.timeUnit,
    dateFrom: firstTimeseries.dateFrom,
    intl,
    expanded,
    seriesEntries,
  });

  return <ApexChart type="area" width="100%" height="100%" options={options} series={apexSeries} />;
}

export default function MultiSeriesChart(props: MultiSeriesChartProps) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <MessageBox type="error" withIcon>
          {error.message}
        </MessageBox>
      )}
    >
      <Chart {...props} />
    </ErrorBoundary>
  );
}

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

const makeApexOptions = ({ currency, timeUnit, dateFrom, intl, compareFrom, expanded }): ApexOptions => ({
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
    show: false,
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
      formatter: value =>
        isNil(value)
          ? intl.formatMessage({ defaultMessage: 'No data', id: 'UG5qoS' })
          : !currency
            ? value
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
          let startDate;

          if (seriesName === 'current') {
            startDate = dateFrom;
          } else if (seriesName === 'comparison') {
            startDate = compareFrom;
          } else {
            return '';
          }
          return formatDateLabel({ startDate, index: dataPointIndex, timeUnit });
        },
      },
    },
  },
});

const getSeries = ({ current, comparison, color = '#1d4ed8' }): ApexOptions['series'] => {
  const series = [{ name: 'current', data: formatSeriesData(current), color, zIndex: 2 }];
  if (comparison) {
    series.push({ name: 'comparison', data: formatSeriesData(comparison), color: '#cbd5e1', zIndex: 1 });
  }
  return series;
};

interface ComparisonChartProps {
  current: TimeSeriesAmount;
  comparison?: TimeSeriesAmount;
  currency?: Currency;
  expanded?: boolean;
  isPeriod?: boolean;
  color?: string;
}

function Chart({ current, comparison, expanded, currency, color }: ComparisonChartProps) {
  const intl = useIntl();

  // When using the "All time" option, the API does not return a dateFrom value, instead we pick the lowest returned date to start the time series.
  // This is a temporary solution until the API returns the dateFrom value.
  const currentWithDates = React.useMemo(() => setDatesIfMissing(current), [current]);

  const series = React.useMemo(
    () => getSeries({ current: currentWithDates, comparison, color }),
    [currentWithDates, comparison, color],
  );

  const options = makeApexOptions({
    currency,
    timeUnit: current.timeUnit,
    dateFrom: currentWithDates.dateFrom,
    compareFrom: comparison?.dateFrom,
    intl,
    expanded,
  });

  return <ApexChart type="area" width="100%" height="100%" options={options} series={series} />;
}

export default function ComparisonChart(props: ComparisonChartProps) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <MessageBox type="error" withIcon>
          {error['message']}
        </MessageBox>
      )}
    >
      <Chart {...props} />
    </ErrorBoundary>
  );
}

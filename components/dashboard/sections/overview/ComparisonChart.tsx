import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import { isNil } from 'lodash';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';

import { formatAmountForLegend } from '../../../../lib/charts';
import { getDayjsIsoUnit } from '../../../../lib/date-utils';
import dayjs from '../../../../lib/dayjs';
import { Currency, TimeSeriesAmount } from '../../../../lib/graphql/types/v2/graphql';

import MessageBox from '../../../MessageBox';
import { formatPeriod } from '../../filters/PeriodCompareFilter';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const formatSeriesData = ({ nodes = [], dateFrom, dateTo, timeUnit }): { x: number; y: number }[] => {
  const keyedData = {};

  const startDate = dayjs.utc(dateFrom).startOf(timeUnit === 'WEEK' ? 'isoWeek' : timeUnit);
  const endDate = dayjs.utc(dateTo);
  const now = dayjs.utc();
  let currentDate = startDate;
  let i = 0;

  // Create entries for each period in the range
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
    keyedData[currentDate.toISOString()] = {
      x: i,
      y: now.isAfter(currentDate) ? 0 : undefined,
    };
    i++;
    currentDate = currentDate.add(1, timeUnit);
  }

  // Add the time series data
  for (let i = 0; i < nodes.length; i++) {
    const { date, amount } = nodes[i];
    if (keyedData[date]) {
      keyedData[date].y = amount.value;
    } else {
      // Will be caught by error boundary.
      throw new Error('Time series data not aligned');
    }
  }

  return Object.values(keyedData);
};

const formatDateLabel = ({ startDate, index, timeUnit }): string => {
  const date = dayjs.utc(startDate).add(index, timeUnit);
  if (timeUnit === 'YEAR') {
    return date.year().toString();
  } else if (timeUnit === 'MONTH') {
    return date.format('MMM YYYY');
  } else if (timeUnit === 'WEEK') {
    const endDate = date.add(6, 'day');
    return formatPeriod({ from: date, to: endDate });
  } else if (timeUnit === 'DAY') {
    return date.format('MMM D, YYYY');
  } else if (timeUnit === 'HOUR') {
    return date.format('MMM D, YYYY h:mm A');
  }
};

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
    radius: expanded ? 2 : 0,
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
        return formatDateLabel({ startDate: dateFrom, index: value, timeUnit });
      },
    },
  },
  yaxis: {
    min: 0,
    labels: {
      show: expanded,
      formatter: value =>
        isNil(value)
          ? intl.formatMessage({ defaultMessage: 'No data' })
          : formatAmountForLegend(value, currency, intl.locale),
    },
  },
  tooltip: {
    x: {
      show: false,
    },
    y: {
      title: {
        // @ts-ignore - the second argument containing dataPointIndex is missing in the type definition
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

const getSeries = ({ current, comparison }): ApexOptions['series'] => {
  const series = [{ name: 'current', data: formatSeriesData(current), color: '#1d4ed8', zIndex: 2 }];
  if (comparison) {
    series.push({ name: 'comparison', data: formatSeriesData(comparison), color: '#cbd5e1', zIndex: 1 });
  }
  return series;
};

interface ComparisonChartProps {
  current: TimeSeriesAmount;
  comparison?: TimeSeriesAmount;
  currency: Currency;
  expanded?: boolean;
  isPeriod?: boolean;
}

function setDatesIfMissing(timeseries: TimeSeriesAmount): TimeSeriesAmount {
  if (!timeseries.dateFrom || !timeseries.dateTo) {
    let dateFrom, dateTo;

    if (!timeseries.dateFrom) {
      // find the lowest date by comparing all nodes in current
      dateFrom = timeseries.nodes.reduce((lowest, node) => {
        return node.date < lowest ? node.date : lowest;
      }, timeseries.nodes[0].date);
    }

    if (!timeseries.dateTo) {
      dateTo = dayjs.utc().endOf(getDayjsIsoUnit(timeseries.timeUnit));
    }

    return {
      ...timeseries,
      dateFrom: dateFrom,
      dateTo: dateTo,
    };
  }
  return timeseries;
}

function Chart({ current, comparison, expanded, currency }: ComparisonChartProps) {
  const intl = useIntl();

  // When using the "All time" option, the API does not return a dateFrom value, instead we pick the lowest returned date to start the time series.
  // This is a temporary solution until the API returns the dateFrom value.
  const currentWithDates = React.useMemo(() => setDatesIfMissing(current), [current]);

  const series = React.useMemo(
    () => getSeries({ current: currentWithDates, comparison }),
    [currentWithDates, comparison],
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
          {error.message}
        </MessageBox>
      )}
    >
      <Chart {...props} />
    </ErrorBoundary>
  );
}

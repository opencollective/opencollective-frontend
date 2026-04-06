import type { ManipulateType, OpUnitType } from 'dayjs';
import { difference, flatten, get, groupBy, identity, uniq } from 'lodash';

import { formatPeriod } from '../components/dashboard/filters/PeriodCompareFilter';

import type { TimeSeriesAmount } from './graphql/types/v2/graphql';
import { getDayjsIsoUnit } from './date-utils';
import dayjs from './dayjs';

/**
 * If a date doesn't have any data attached, API returns nothing.
 * But we need to make sure all series show 0 in these cases rather than `NaN` which
 * is shown by default by Apex charts.
 */
export const alignSeries = (series, sort = (a, b) => +new Date(a.x) - +new Date(b.x)) => {
  const indexesBySeries = series.map(singleSeries => singleSeries.data.map(d => d.x));
  const uniqueIndexes = uniq(flatten(indexesBySeries));
  indexesBySeries.forEach((_, idx) => {
    const missingIndexes = difference(uniqueIndexes, indexesBySeries[idx]);
    if (missingIndexes.length) {
      series[idx].data.push(...missingIndexes.map(x => ({ x, y: 0 })));
    }
    series[idx].data.sort(sort);
  });

  return series;
};

export const extractSeriesFromTimeSeries = (timeSeries, { x, y, group, groupNameTransformer = identity }) => {
  const groups = groupBy(timeSeries, group);

  const categories = Object.keys(groups);
  const series = categories.map(name => {
    const data = groups[name].map(value => ({ x: get(value, x), y: get(value, y) }));
    return { name: groupNameTransformer(name), data };
  });

  return { series, categories };
};

export const formatAmountForLegend = (value, currency, locale, isCompactNotation = true) => {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
    notation: isCompactNotation ? 'compact' : 'standard',
  }).format(value);
};

/**
 * Format time series nodes into an array of {x, y} data points aligned to the date range.
 * When dateFrom/dateTo are not provided, falls back to a simple index-based mapping.
 */
export const formatSeriesData = ({
  nodes = [],
  dateFrom = undefined,
  dateTo = undefined,
  timeUnit,
}: {
  nodes?: TimeSeriesAmount['nodes'];
  dateFrom?: string;
  dateTo?: string;
  timeUnit: string;
}): { x: number; y: number }[] => {
  if (!dateFrom || !dateTo) {
    return nodes.map((node, i) => {
      const { amount, count } = node;
      return {
        x: i,
        y: amount ? Math.abs(amount.value ?? (amount.valueInCents ? amount.valueInCents / 100 : 0)) : count,
      };
    });
  }

  const keyedData = {};

  const unit = timeUnit.toLowerCase() as ManipulateType;
  const startDate = dayjs.utc(dateFrom).startOf(timeUnit === 'WEEK' ? 'isoWeek' : (unit as OpUnitType));
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
    currentDate = currentDate.add(1, unit);
  }

  // Add the time series data
  for (let i = 0; i < nodes.length; i++) {
    const { date, amount, count } = nodes[i];
    if (keyedData[date]) {
      keyedData[date].y = amount
        ? Math.abs(amount.value ?? (amount.valueInCents ? amount.valueInCents / 100 : 0))
        : count;
    } else {
      // Will be caught by error boundary.
      throw new Error('Time series data not aligned');
    }
  }

  return Object.values(keyedData);
};

/**
 * Format a date label for a given index in a time series, based on the time unit.
 */
export const formatDateLabel = ({
  startDate,
  index,
  timeUnit,
}: {
  startDate: string;
  index: number;
  timeUnit: string;
}): string => {
  const unit = timeUnit.toLowerCase() as ManipulateType;
  const tu = timeUnit.toUpperCase();
  const date = dayjs.utc(startDate).add(index, unit);
  if (tu === 'YEAR') {
    return date.year().toString();
  } else if (tu === 'MONTH') {
    return date.format('MMM YYYY');
  } else if (tu === 'WEEK') {
    const endDate = date.add(6, 'day');
    return formatPeriod({ from: date, to: endDate });
  } else if (tu === 'DAY') {
    return date.format('MMM D, YYYY');
  } else if (tu === 'HOUR') {
    return date.format('MMM D, YYYY h:mm A');
  }
};

/**
 * When using the "All time" option, the API does not return a dateFrom value.
 * This helper fills in missing dateFrom/dateTo by deriving them from the nodes.
 */
export function setDatesIfMissing(timeseries: TimeSeriesAmount): TimeSeriesAmount {
  if (!timeseries.dateFrom || !timeseries.dateTo) {
    let dateFrom, dateTo;

    if (!timeseries.dateFrom) {
      // find the lowest date by comparing all nodes
      dateFrom = timeseries.nodes.reduce((lowest, node) => {
        return node.date < lowest ? node.date : lowest;
      }, timeseries.nodes[0].date);
    }

    if (!timeseries.dateTo) {
      dateTo = dayjs.utc().endOf(getDayjsIsoUnit(timeseries.timeUnit));
    }

    return {
      ...timeseries,
      dateFrom: dateFrom ?? timeseries.dateFrom,
      dateTo: dateTo ?? timeseries.dateTo,
    };
  }
  return timeseries;
}

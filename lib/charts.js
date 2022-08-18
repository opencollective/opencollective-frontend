import { difference, flatten, get, groupBy, identity, uniq } from 'lodash';

/**
 * If a date doesn't have any data attached, API returns nothing.
 * But we need to make sure all series show 0 in these cases rather than `NaN` which
 * is shown by default by Apex charts.
 */
export const alignSeries = (series, sort = (a, b) => new Date(a.x) - new Date(b.x)) => {
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

export const extractSeriesFromTimeSeries = (timeSeries, { x, y, group, sort, groupNameTransformer = identity }) => {
  const groups = groupBy(timeSeries, group);

  const categories = Object.keys(groups);
  const series = categories.map(name => {
    const data = groups[name].map(value => ({ x: get(value, x), y: get(value, y) }));
    return { name: groupNameTransformer(name), data };
  });

  alignSeries(series, sort);

  return { series, categories };
};

export const formatAmountForLegend = (value, currency, locale, isCompactNotation = true) => {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
    notation: isCompactNotation ? 'compact' : 'standard',
  }).format(value);
};

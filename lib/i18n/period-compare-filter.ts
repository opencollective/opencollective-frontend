import { defineMessages } from 'react-intl';

import { PeriodFilterCompare, PeriodFilterType } from '../../components/dashboard/filters/PeriodCompareFilter/schema';

import { TimeUnit } from '../graphql/types/v2/graphql';

export const i18nPeriodFilterCompare = defineMessages({
  [PeriodFilterCompare.PREVIOUS_PERIOD]: {
    id: 'PeriodCompareFilter.PreviousPeriod',
    defaultMessage: 'Previous period',
  },
  [PeriodFilterCompare.PREVIOUS_MONTH]: {
    id: 'PeriodCompareFilter.PreviousMonth',
    defaultMessage: 'Previous month',
  },
  [PeriodFilterCompare.PREVIOUS_QUARTER]: {
    id: 'PeriodCompareFilter.PreviousQuarter',
    defaultMessage: 'Previous quarter',
  },
  [PeriodFilterCompare.PREVIOUS_YEAR]: {
    id: 'PeriodCompareFilter.PreviousYear',
    defaultMessage: 'Previous year',
  },
  [PeriodFilterCompare.NO_COMPARISON]: {
    id: 'PeriodCompareFilter.NoComparison',
    defaultMessage: 'No comparison',
  },
});
export const i18nPeriodFilterType = defineMessages({
  [PeriodFilterType.TODAY]: {
    defaultMessage: 'Today',
  },
  [PeriodFilterType.LAST_7_DAYS]: {
    defaultMessage: 'Last 7 days',
  },
  [PeriodFilterType.LAST_4_WEEKS]: {
    defaultMessage: 'Last 4 weeks',
  },
  [PeriodFilterType.LAST_3_MONTHS]: {
    defaultMessage: 'Last 3 months',
  },
  [PeriodFilterType.LAST_12_MONTHS]: {
    defaultMessage: 'Last 12 months',
  },
  [PeriodFilterType.MONTH_TO_DATE]: {
    defaultMessage: 'Month to date',
  },
  [PeriodFilterType.QUARTER_TO_DATE]: {
    defaultMessage: 'Quarter to date',
  },
  [PeriodFilterType.YEAR_TO_DATE]: {
    defaultMessage: 'Year to date',
  },
  [PeriodFilterType.ALL_TIME]: {
    defaultMessage: 'All time',
  },
  [PeriodFilterType.CUSTOM]: {
    defaultMessage: 'Custom',
  },
});

export const i18nTimeUnit = defineMessages({
  [TimeUnit.HOUR]: {
    id: 'Frequency.Hourly',
    defaultMessage: 'Hourly',
  },
  [TimeUnit.DAY]: {
    id: 'virtualCard.intervalLimit.daily',
    defaultMessage: 'Daily',
  },
  [TimeUnit.WEEK]: {
    id: 'week',
    defaultMessage: 'Weekly',
  },
  [TimeUnit.MONTH]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [TimeUnit.YEAR]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

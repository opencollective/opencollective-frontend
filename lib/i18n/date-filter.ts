import { defineMessages } from 'react-intl';

import { DateFilterType, Period } from '../../components/dashboard/filters/DateFilter/schema';

const i18nFilterOption = defineMessages({
  [DateFilterType.IN_LAST_PERIOD]: {
    id: 'Filter.date.inTheLast',
    defaultMessage: 'in the last',
  },
  [DateFilterType.EQUAL_TO]: {
    id: 'Filter.isEqualTo',
    defaultMessage: 'is equal to',
  },
  [DateFilterType.BETWEEN]: {
    id: 'Filter.isBetween',
    defaultMessage: 'is between',
  },
  [DateFilterType.AFTER]: {
    id: 'Filter.date.isAfter',
    defaultMessage: 'is after',
  },
  [DateFilterType.ON_OR_AFTER]: {
    id: 'Filter.date.isOnOrAfter',
    defaultMessage: 'is on or after',
  },
  [DateFilterType.BEFORE]: {
    id: 'Filter.date.isBefore',
    defaultMessage: 'is before',
  },
  [DateFilterType.BEFORE_OR_ON]: {
    id: 'Filter.date.isBeforeOrOn',
    defaultMessage: 'is before or on',
  },
});

const i18nDatePeriod = defineMessages({
  [Period.DAYS]: {
    id: 'Period.days',
    defaultMessage: 'days',
  },
  [Period.WEEKS]: {
    id: 'Period.weeks',
    defaultMessage: 'weeks',
  },
  [Period.MONTHS]: {
    id: 'Period.months',
    defaultMessage: 'months',
  },
  [Period.YEARS]: {
    id: 'Period.years',
    defaultMessage: 'years',
  },
});

export const i18nDateFilterLabel = (intl, type) => {
  return i18nFilterOption[type] ? intl.formatMessage(i18nFilterOption[type]) : type;
};

export const i18nDatePeriodLabel = (intl, period) => {
  return i18nDatePeriod[period] ? intl.formatMessage(i18nDatePeriod[period]) : period;
};

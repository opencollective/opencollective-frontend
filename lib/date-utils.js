import { padStart } from 'lodash';

import INTERVALS from './constants/intervals';

/**
 * For a given date, return the next charge date.
 *
 * @param {Date} firstChargeDate
 * @param {month|year} interval
 */
export const getNextChargeDate = (firstChargeDate, interval) => {
  if (interval === INTERVALS.month) {
    if (firstChargeDate.getDate() > 15) {
      return new Date(firstChargeDate.getFullYear(), firstChargeDate.getMonth() + 2);
    }
    return new Date(firstChargeDate.getFullYear(), firstChargeDate.getMonth() + 1);
  } else if (interval === INTERVALS.year) {
    return new Date(firstChargeDate.getFullYear() + 1, firstChargeDate.getMonth());
  } else {
    return null;
  }
};

/** Adds `count` months to the given `date` */
export const addMonths = (date, count) => {
  return new Date(date.setMonth(date.getMonth() + count));
};

/** Adds `count` years to the given `date` */
export const addYears = (date, count) => {
  return new Date(date.setFullYear(date.getFullYear() + count));
};

/**
 * Format a datetime object to an ISO date like `YYYY-MM-DD`
 */
export const toIsoDateStr = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getUTCDate();
  return `${year}-${padStart(month.toString(), 2, '0')}-${padStart(day.toString(), 2, '0')}`;
};

/**
 * From an order frequency provided as `ContributionFrequency` GQLV2 enum, returns an interval
 * as we use it in the DB (ie. MONTHLY => month)
 */
export const getIntervalFromContributionFrequency = input => {
  switch (input) {
    case 'MONTHLY':
      return INTERVALS.month;
    case 'YEARLY':
      return INTERVALS.year;
    default:
      return null;
  }
};

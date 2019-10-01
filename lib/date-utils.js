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
    return new Date(firstChargeDate.getFullYear(), firstChargeDate.getMonth() + 1);
  } else if (interval === INTERVALS.year) {
    return new Date(firstChargeDate.getFullYear() + 1, firstChargeDate.getMonth());
  } else {
    return null;
  }
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

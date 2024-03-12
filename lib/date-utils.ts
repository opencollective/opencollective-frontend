import { OpUnitType, UnitType } from 'dayjs';
import { padStart } from 'lodash';

import INTERVALS from './constants/intervals';
import { PAYMENT_METHOD_SERVICE } from './constants/payment-methods';
import { TimeUnit } from './graphql/types/v2/graphql';
import dayjs from './dayjs';

/**
 * For a given date, return the next charge date.
 *
 * @param {Date} firstChargeDate
 * @param {month|year} interval
 */
export const getNextChargeDate = (firstChargeDate, interval, paymentMethodService) => {
  if (paymentMethodService === PAYMENT_METHOD_SERVICE.PAYPAL) {
    return dayjs(firstChargeDate).add(1, interval).toDate();
  }

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
 * Get the current date in the local timezone as a string like `YYYY-MM-DD`
 */
export const getCurrentLocalDateStr = () => {
  return toIsoDateStr(new Date());
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
    case 'FLEXIBLE':
      return INTERVALS.flexible;
    default:
      return null;
  }
};

/**
 * Takes a date and returns it as a string in the format YYYY-MM-DD
 */
export const stripTime = date => {
  if (!date) {
    return null;
  } else {
    return dayjs(date).format('YYYY-MM-DD');
  }
};

/**
 * A helper that returns a Date object from different types of input.
 * Currently supports:
 * - string: ISO date string
 * - Date object
 * - DayJS object
 * - null
 */
export const getDateFromValue = (value): Date | null => {
  if (!value) {
    return null;
  } else if (typeof value === 'string') {
    return new Date(value);
  } else if (value instanceof Date) {
    return value;
  } else if (dayjs.isDayjs(value)) {
    return value.toDate();
  }
};

/**
 * From a simple date as '2020-01-01', returns a string like '2020-01-01T00:00:00Z'.
 */
export const simpleDateToISOString = (date, isEndOfDay, timezoneType) => {
  if (!date) {
    return null;
  } else {
    const isUTC = timezoneType === 'UTC';
    const dayjsTimeMethod = isEndOfDay ? 'endOf' : 'startOf';
    const result = isUTC ? dayjs.utc(date) : dayjs(date);
    return result[dayjsTimeMethod]('day').toISOString();
  }
};

/**
 * Parse `strValue` in a "dateFrom→dateTo" format and returns an object like { from, to, timezoneType }.
 * Each value in the object will be `undefined` if there's no filter for it.
 */
export const parseDateInterval = strValue => {
  const parsedValue = strValue?.match(/^(?<from>[^→]+)(→(?<to>.+?(?=~UTC|$)))?(~(?<timezoneType>UTC))?$/);
  if (parsedValue) {
    const getDateIsoString = dateStr => (!dateStr || dateStr === 'all' ? undefined : dateStr);
    return {
      from: getDateIsoString(parsedValue.groups.from),
      to: getDateIsoString(parsedValue.groups.to),
      timezoneType: parsedValue.groups.timezoneType || 'local',
    };
  } else {
    return { from: undefined, to: undefined, timezoneType: 'local' };
  }
};

/**
 * Opposite of `parseDateInterval`: takes an object like {from, to, timezoneType} and returns a string
 * like "from→to".
 */
export const encodeDateInterval = interval => {
  if (!interval || (!interval.from && !interval.to)) {
    return '';
  }

  const encodeDate = (date, isEndOfDay) => {
    return simpleDateToISOString(date, isEndOfDay, interval.timezoneType) || 'all';
  };

  const baseResult = `${encodeDate(interval.from, false)}→${encodeDate(interval.to, true)}`;
  return interval.timezoneType === 'UTC' ? `${baseResult}~UTC` : baseResult;
};

export const convertDateToApiUtc = (date, timezone) => {
  return dayjs.tz(date, timezone).utc().format('YYYY-MM-DD HH:mm:ss+00');
};

export const convertDateFromApiUtc = (date, timezone) => {
  return dayjs(date).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

export const getDayjsIsoUnit = (timeUnit: TimeUnit): OpUnitType | 'isoWeek' => {
  // Use "isoWeek" to have the week start on Monday, in accordance with the behavior from the API returning time series data
  // Note: "isoWeek" should only be used when finding the startOf or endOf a period, for regular adding and subtracting, "week" should be used.
  if (timeUnit === TimeUnit.WEEK) {
    return 'isoWeek';
  }
  return timeUnit.toLowerCase() as OpUnitType;
};

export const getDayjsOpUnit = (timeUnit: TimeUnit): UnitType => {
  return timeUnit.toLowerCase() as UnitType;
};

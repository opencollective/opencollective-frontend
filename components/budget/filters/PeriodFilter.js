import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { addMonths, addYears } from '../../../lib/date-utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const OPTION_LABELS = defineMessages({
  ALL: {
    id: 'DateRange.All',
    defaultMessage: 'All',
  },
  month: {
    id: 'DateRange.PastMonths',
    defaultMessage: 'Past {count,plural, one {month} other {# months}}',
  },
  year: {
    id: 'DateRange.PastYears',
    defaultMessage: 'Past {count,plural, one {year} other {# years}}',
  },
});

/**
 * Parse `strValue` and returns an array like [period, duration] (ie. ['month', 6]) or `null`
 * if not a valid value.
 */
const parsePeriod = strValue => {
  const parsedValue = strValue?.match(/((\d+)-)?(month|year)/);
  if (!parsedValue) {
    return null;
  } else {
    return [parseInt(parsedValue[2]) || 1, parsedValue[3]];
  }
};

/**
 * Parse `strValue` and returns an array like [dateFrom, dateTo]. Each value in the array
 * will be `undefined` if there's no filter for it.
 */
export const getDateRangeFromPeriod = strValue => {
  const period = parsePeriod(strValue);
  if (!period) {
    return [];
  } else {
    // Use a normalized date (without time) to better handle Apollo caching
    const nowDateTime = new Date();
    const now = new Date(nowDateTime.getFullYear(), nowDateTime.getMonth(), nowDateTime.getDate());
    const dateAddFunc = period[1] === 'month' ? addMonths : addYears;
    return [dateAddFunc(now, -period[0]), now];
  }
};

const encodePeriod = (duration, period) => {
  return duration !== 1 ? `${duration}-${period}` : period;
};

const PeriodFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const allPeriodsOption = { label: intl.formatMessage(OPTION_LABELS.ALL), value: 'ALL' };
  const selected = parsePeriod(value);
  const getOption = (duration, period) => ({
    value: encodePeriod(duration, period),
    label: intl.formatMessage(OPTION_LABELS[period], { count: duration }),
  });

  return (
    <StyledSelectFilter
      data-cy="expenses-filter-period"
      value={selected ? getOption(...selected) : allPeriodsOption}
      onChange={({ value }) => onChange(value)}
      options={[allPeriodsOption, getOption(1, 'month'), getOption(6, 'month'), getOption(1, 'year')]}
      {...props}
    />
  );
};

PeriodFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default PeriodFilter;

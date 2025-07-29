import React from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nDateFilterLabel } from '../../../../lib/i18n/date-filter';

import type { DateFilterValueType } from './schema';
import { DateFilterType } from './schema';

const OneLineDate = ({ value }) => {
  // Passing timeZone="utc" to FormattedDate means that we will not convert this date to the local users timezone,
  // since they have already decided what timezone to use when setting this date.
  // Otherwise, the date would be converted to the local users timezone, which would be incorrect.
  return value ? <FormattedDate timeZone="utc" dateStyle={'medium'} value={value} /> : null;
};

const getMessage = (intl, dateRange: DateFilterValueType) => {
  switch (dateRange.type) {
    case DateFilterType.IN_LAST_PERIOD:
      return (
        <FormattedMessage
          defaultMessage="Last {number} {period}"
          id="GsX5Fk"
          values={{ number: dateRange.number, period: i18nDateFilterLabel(intl, dateRange.period) }}
        />
      );
    case DateFilterType.EQUAL_TO:
      return (
        <FormattedMessage
          defaultMessage="On {date}"
          id="KGXk/j"
          values={{ date: <OneLineDate value={dateRange.gte} /> }}
        />
      );
    case DateFilterType.BETWEEN:
      return (
        <FormattedMessage
          defaultMessage="{dateFrom} to {dateTo}"
          id="76YT3Y"
          values={{
            dateFrom: <OneLineDate value={dateRange.gte} />,
            dateTo: <OneLineDate value={dateRange.lte} />,
          }}
        />
      );
    case DateFilterType.AFTER:
      return (
        <FormattedMessage
          defaultMessage="After {date}"
          id="Bl8xZP"
          values={{ date: <OneLineDate value={dateRange.gt} /> }}
        />
      );
    case DateFilterType.ON_OR_AFTER:
      return (
        <FormattedMessage
          defaultMessage="Starting from {date}"
          id="iCd6C/"
          values={{ date: <OneLineDate value={dateRange.gte} /> }}
        />
      );
    case DateFilterType.BEFORE:
      return (
        <FormattedMessage
          defaultMessage="Before {date}"
          id="U5sjCv"
          values={{ date: <OneLineDate value={dateRange.lt} /> }}
        />
      );
    case DateFilterType.BEFORE_OR_ON:
      return (
        <FormattedMessage
          defaultMessage="Ending on {date}"
          id="VXJpMP"
          values={{ date: <OneLineDate value={dateRange.lte} /> }}
        />
      );
    default:
      return null;
  }
};

/**
 * Small helper to display an internationalized date range. Both values are optional.
 * The results can be something like:
 * - Before Nov 16, 2023
 * - Nov 16, 2023 to Nov 25, 2023
 * If tz === 'UTC' we also add a `(UTC)` to the end of the date.
 */
export const DateFilterValue = ({ value }: { value: DateFilterValueType }) => {
  const intl = useIntl();
  const message = getMessage(intl, value);
  const isUTC = value?.tz === 'UTC';
  if (!isUTC) {
    return <div>{message}</div>;
  } else {
    return <div>{message} (UTC)</div>;
  }
};

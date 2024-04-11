import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nDateFilterLabel } from '../../../../lib/i18n/date-filter';

import DateTime from '../../../DateTime';

import { DateFilterType, DateFilterValueType } from './schema';

const OneLineDate = ({ value, ...props }) =>
  value ? <DateTime className="inline-block whitespace-nowrap" value={value} {...props} /> : null;

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
          values={{ date: <OneLineDate value={dateRange.gte} dateStyle="medium" /> }}
        />
      );
    case DateFilterType.BETWEEN:
      return (
        <FormattedMessage
          defaultMessage="{dateFrom} to {dateTo}"
          id="76YT3Y"
          values={{
            dateFrom: <OneLineDate value={dateRange.gte} dateStyle="medium" />,
            dateTo: <OneLineDate value={dateRange.lte} dateStyle="medium" />,
          }}
        />
      );
    case DateFilterType.AFTER:
      return (
        <FormattedMessage
          defaultMessage="After {date}"
          id="Bl8xZP"
          values={{ date: <OneLineDate value={dateRange.gt} dateStyle="medium" /> }}
        />
      );
    case DateFilterType.ON_OR_AFTER:
      return (
        <FormattedMessage
          defaultMessage="Starting from {date}"
          id="iCd6C/"
          values={{ date: <OneLineDate value={dateRange.gte} dateStyle="medium" /> }}
        />
      );
    case DateFilterType.BEFORE:
      return (
        <FormattedMessage
          defaultMessage="Before {date}"
          id="U5sjCv"
          values={{ date: <OneLineDate value={dateRange.lt} dateStyle="medium" /> }}
        />
      );
    case DateFilterType.BEFORE_OR_ON:
      return (
        <FormattedMessage
          defaultMessage="Ending on {date}"
          id="VXJpMP"
          values={{ date: <OneLineDate value={dateRange.lte} dateStyle="medium" /> }}
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

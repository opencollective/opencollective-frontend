import React from 'react';
import { defineMessage, FormattedDate, useIntl } from 'react-intl';

import { getDateFromValue } from '../lib/date-utils';
import type dayjs from '../lib/dayjs';
import { capitalize } from '../lib/utils';

const TITLE_MESSAGE = defineMessage({
  defaultMessage: 'Local time: {localTime}{newLine}UTC time: {utcTime}',
  id: '9kdoVP',
});

export const generateDateTitle = (intl, date) => {
  return intl.formatMessage(TITLE_MESSAGE, {
    localTime: capitalize(intl.formatDate(date, { dateStyle: 'full', timeStyle: 'long' })),
    utcTime: capitalize(intl.formatDate(date, { dateStyle: 'full', timeStyle: 'long', timeZone: 'UTC' })),
    newLine: '\n',
  });
};

type DateTimeProps = {
  value: string | Date | typeof dayjs;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short' | null | undefined;
  omitTimeIfMidnight?: boolean;
  className?: string;
};

/**
 * A wrapper around `FormattedDate` + HTML `<time>` with sensible defaults.
 * Displays the full date and time in the user's locale and in UTC in the title.
 */
const DateTime = ({ value, dateStyle, timeStyle, omitTimeIfMidnight, ...props }: DateTimeProps) => {
  const intl = useIntl();
  const [title, setTitle] = React.useState();
  const date = React.useMemo(() => getDateFromValue(value), [value]);

  if (omitTimeIfMidnight && timeStyle) {
    timeStyle = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 ? undefined : timeStyle;
  }

  return (
    <time
      {...props}
      title={title}
      dateTime={date.toISOString()}
      onMouseEnter={() => setTitle(generateDateTitle(intl, date))}
      suppressHydrationWarning
    >
      <FormattedDate dateStyle={dateStyle || 'long'} timeStyle={timeStyle} value={date} />
    </time>
  );
};

export default DateTime;

import React from 'react';
import PropTypes from 'prop-types';
import { defineMessage, FormattedDate, useIntl } from 'react-intl';

import { getDateFromValue } from '../lib/date-utils';
import dayjs from '../lib/dayjs';
import { capitalize } from '../lib/utils';

const TITLE_MESSAGE = defineMessage({
  defaultMessage: 'Local time: {localTime}{newLine}UTC time: {utcTime}',
});

export const generateDateTitle = (intl, date) => {
  return intl.formatMessage(TITLE_MESSAGE, {
    localTime: capitalize(intl.formatDate(date, { dateStyle: 'full', timeStyle: 'long' })),
    utcTime: capitalize(intl.formatDate(date, { dateStyle: 'full', timeStyle: 'long', timeZone: 'UTC' })),
    newLine: '\n',
  });
};

/**
 * A wrapper around `FormattedDate` + HTML `<time>` with sensible defaults.
 * Displays the full date and time in the user's locale and in UTC in the title.
 */
const DateTime = ({ value, dateStyle, timeStyle, ...props }) => {
  const intl = useIntl();
  const [title, setTitle] = React.useState();
  const date = React.useMemo(() => getDateFromValue(value), [value]);
  return (
    <time
      {...props}
      title={title}
      dateTime={date.toISOString()}
      onMouseEnter={() => setTitle(generateDateTitle(intl, date))}
    >
      <FormattedDate dateStyle={dateStyle} timeStyle={timeStyle} value={date} />
    </time>
  );
};

DateTime.propTypes = {
  /** The value as a Date or as a parsable string */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.instanceOf(dayjs)]).isRequired,
  /** Date style, set this to null to hide the date */
  dateStyle: PropTypes.oneOf(['full', 'long', 'medium', 'short']),
  /** Time style, set this to display the time along with the date */
  timeStyle: PropTypes.oneOf(['full', 'long', 'medium', 'short', undefined, null]),
};

DateTime.defaultProps = {
  dateStyle: 'long',
};

export default DateTime;

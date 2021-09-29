import React from 'react';
import PropTypes from 'prop-types';
import { defineMessage, FormattedDate, useIntl } from 'react-intl';

import { capitalize } from '../lib/utils';

const getDateFromValue = value => {
  if (!value) {
    return null;
  } else if (typeof value === 'string') {
    return new Date(value);
  } else if (value instanceof Date) {
    return value;
  }
};

const TITLE_MESSAGE = defineMessage({
  defaultMessage: 'Local time: {localTime}{newLine}UTC time: {utcTime}',
});

const generateTitle = (intl, date) => {
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
  const date = getDateFromValue(value);
  return (
    <time
      {...props}
      title={title}
      dateTime={date.toISOString()}
      onMouseEnter={() => setTitle(generateTitle(intl, date))}
    >
      <FormattedDate dateStyle={dateStyle} timeStyle={timeStyle} value={date} />
    </time>
  );
};

DateTime.propTypes = {
  /** The value as a Date or as a parsable string */
  value: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]).isRequired,
  /** Date style, set this to null to hide the date */
  dateStyle: PropTypes.oneOf(['full', 'long', 'medium', 'short']),
  /** Time style, set this to display the time along with the date */
  timeStyle: PropTypes.oneOf(['full', 'long', 'medium', 'short']),
};

DateTime.defaultProps = {
  dateStyle: 'long',
};

export default DateTime;

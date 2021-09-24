import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const getMessage = (from, to) => {
  if (!from && !to) {
    return <FormattedMessage id="DateRange.All" defaultMessage="All" />;
  } else if (from && to) {
    return (
      <FormattedMessage
        id="Date.DateRange"
        defaultMessage="{dateFrom, date, short} to {dateTo, date, short}"
        values={{ dateFrom: new Date(from), dateTo: new Date(to) }}
      />
    );
  } else if (from) {
    return (
      <FormattedMessage
        id="Date.SinceShort"
        defaultMessage="Since {date, date, short}"
        values={{ date: new Date(from) }}
      />
    );
  } else {
    return (
      <FormattedMessage
        id="Date.BeforeShort"
        defaultMessage="Before {date, date, short}"
        values={{ date: new Date(to) }}
      />
    );
  }
};

/**
 * Small helper to display an internationalized date range. Both values are optional.
 * The results can be something like:
 * - All
 * - 01/01/21 to 05/05/22
 * - Since 01/01/21
 * - Before 05/05/22
 *
 * If isUTC is true, we also add a `(UTC)` to the end of the date.
 */
export const DateRange = ({ from, to, isUTC }) => {
  const message = getMessage(from, to);
  if (!isUTC || (!from && !to)) {
    return message;
  } else {
    return <React.Fragment>{message} (UTC)</React.Fragment>;
  }
};

DateRange.propTypes = {
  from: PropTypes.string,
  to: PropTypes.string,
  isUTC: PropTypes.bool,
};

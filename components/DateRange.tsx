import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import dayjs from '../lib/dayjs';

import DateTime from './DateTime';

const OneLineDate = styled(DateTime)`
  white-space: nowrap;
  display: inline-block;
`;

const getMessage = (from, to) => {
  if (!from && !to) {
    return <FormattedMessage id="DateRange.All" defaultMessage="All" />;
  } else if (from && to) {
    return (
      <div>
        <FormattedMessage
          defaultMessage="{dateFrom} to {dateTo}"
          id="76YT3Y"
          values={{
            dateFrom: <OneLineDate value={from} dateStyle="medium" />,
            dateTo: <OneLineDate value={to} dateStyle="medium" />,
          }}
        />
      </div>
    );
  } else if (from) {
    return (
      <FormattedMessage
        defaultMessage="Since {date}"
        id="x9TypM"
        values={{ date: <OneLineDate value={from} dateStyle="medium" /> }}
      />
    );
  } else {
    return (
      <FormattedMessage
        defaultMessage="Before {date}"
        id="U5sjCv"
        values={{ date: <OneLineDate value={to} dateStyle="medium" /> }}
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
  from: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.instanceOf(dayjs)]),
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.instanceOf(dayjs)]),
  isUTC: PropTypes.bool,
};

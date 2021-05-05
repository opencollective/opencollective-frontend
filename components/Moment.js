import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FormattedDate } from 'react-intl';

dayjs.extend(relativeTime);

const Moment = ({ value, relative }) => {
  const date = dayjs(new Date(value));
  const formattedLongDateStr = date.format('LLLL');
  return <span title={formattedLongDateStr}>{relative ? date.fromNow() : <FormattedDate value={value} />}</span>;
};

Moment.propTypes = {
  value: PropTypes.string.isRequired,
  relative: PropTypes.bool,
};

export default Moment;

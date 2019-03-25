import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FormattedDate } from 'react-intl';

const formatDate = value => new Date(value).toISOString();

const Moment = ({ value, relative }) => {
  const formattedLongDateStr = moment(value).format('LLLL');
  return (
    <span title={formattedLongDateStr}>
      {relative ? moment(formatDate(value)).fromNow() : <FormattedDate value={value} />}
    </span>
  );
};

Moment.propTypes = {
  value: PropTypes.string.isRequired,
  relative: PropTypes.bool,
};

export default Moment;

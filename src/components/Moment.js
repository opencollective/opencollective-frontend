import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FormattedDate } from 'react-intl';

const Moment = ({ value, relative }) => {
  const date = new Date(value);
  const formattedLongDateStr = moment(date).format('LLLL');
  return (
    <span title={formattedLongDateStr}>{relative ? moment(date).fromNow() : <FormattedDate value={value} />}</span>
  );
};

Moment.propTypes = {
  value: PropTypes.string.isRequired,
  relative: PropTypes.bool,
};

export default Moment;

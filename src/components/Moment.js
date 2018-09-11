
import React from 'react';
import moment from 'moment';

const formatDate = (value) => (new Date(value)).toISOString();

const Moment = ({
  value,
}) => (
  <span title={moment(value).format('LLLL')}>{moment(formatDate(value)).fromNow()}</span>
);

export default Moment;

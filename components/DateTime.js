import React from 'react';
import PropTypes from 'prop-types';
import DateTimePicker from 'react-datetime-picker';

import dayjs from '../lib/dayjs';

class DateTime extends React.Component {
  static propTypes = {
    date: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
  };

  render() {
    const props = this.props;
    const { date, timezone } = props;
    const value = dayjs(new Date(date)).tz(timezone);

    return <DateTimePicker value={value.isValid() ? value.toDate() : ''} {...props} />;
  }
}

export default DateTime;

import React from 'react';
import PropTypes from 'prop-types';
import momentTimezone from 'moment-timezone';
import ReactDateTime from 'react-datetime';

class DateTime extends React.Component {
  static propTypes = {
    date: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
  };

  render() {
    const props = this.props;
    const { date, timezone } = props;
    const value = momentTimezone.tz(new Date(date), timezone);

    return <ReactDateTime value={value} utc={timezone === 'utc'} {...props} />;
  }
}

export default DateTime;

import React from 'react';
import ReactDateTime from 'react-datetime';
import momentTimezone from 'moment-timezone';

import '../../node_modules/react-datetime/css/react-datetime.css';

class DateTime extends React.Component {
  render() {
    const props = this.props;
    const { date, timezone } = props;
    const value = momentTimezone.tz(new Date(date), timezone);

    return <ReactDateTime value={value} {...props} />;
  }
}

export default DateTime;

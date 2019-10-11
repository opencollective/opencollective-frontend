import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import momentTimezone from 'moment-timezone';

class TimezonePicker extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    label: PropTypes.string,
    selectedTimezone: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.handleTimezoneChange = this.handleTimezoneChange.bind(this);
  }

  handleTimezoneChange(e) {
    this.props.onChange(e.target.value);
  }

  renderTimezoneEntry(timezone) {
    return (
      <option key={timezone} value={timezone}>
        {timezone}
      </option>
    );
  }

  render() {
    return (
      <FormGroup className="TimezonePicker">
        <ControlLabel>{this.props.label}</ControlLabel>
        <FormControl
          name="timezone"
          componentClass="select"
          placeholder="select"
          onChange={this.handleTimezoneChange}
          value={this.props.selectedTimezone}
        >
          {momentTimezone.tz.names().map(this.renderTimezoneEntry)}
        </FormControl>
      </FormGroup>
    );
  }
}

export default TimezonePicker;

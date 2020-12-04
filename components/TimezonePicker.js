import React from 'react';
import PropTypes from 'prop-types';

import timezones from '../lib/constants/timezones';

import { Box } from './Grid';
import StyledSelect from './StyledSelect';
import { P } from './Text';

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

  handleTimezoneChange(selected) {
    this.props.onChange(selected);
  }

  render() {
    const { selectedTimezone, label, ...props } = this.props;

    return (
      <Box {...props}>
        {label && (
          <P as="label" display="block" color="black.900" mb={1}>
            {label}
          </P>
        )}
        <StyledSelect
          options={timezones.map(tz => ({
            label: tz,
            value: tz,
          }))}
          defaultValue={{ label: selectedTimezone, value: selectedTimezone }}
          onChange={selected => this.handleTimezoneChange(selected)}
          {...props}
        />
      </Box>
    );
  }
}

export default TimezonePicker;

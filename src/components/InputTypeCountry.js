import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { countries } from 'country-data';

import StyledSelect from './StyledSelect';

class InputTypeCountry extends Component {
  static propTypes = {
    name: PropTypes.string,
    onChange: PropTypes.func,
    defaultValue: PropTypes.string,
  };

  state = {
    error: false,
  };

  handleChange = ({ value }) => {
    if (value === null) {
      this.setState({
        error: true,
      });
    } else {
      this.setState({
        error: false,
      });
      this.props.onChange(value);
    }
  };

  getCountryName(countryISO) {
    const { name } = countries[countryISO];
    if (name) {
      return `${name} - ${countryISO}`;
    }
  }

  render() {
    const { error } = this.state;
    const { name, defaultValue } = this.props;
    const countryNames = countries.all.map(({ name, alpha2 }) => `${name} - ${alpha2}`);

    return (
      <StyledSelect
        options={countryNames}
        name={name}
        onChange={this.handleChange}
        error={error}
        defaultValue={this.getCountryName(defaultValue)}
      />
    );
  }
}

export default InputTypeCountry;

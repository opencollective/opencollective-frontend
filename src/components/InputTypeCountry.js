import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StyledSelect from './StyledSelect';

class InputTypeCountry extends Component {
  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        country: PropTypes.string.isRequired,
        abbreviation: PropTypes.string.isRequired,
      }),
    ).isRequired,
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
    const { options } = this.props;
    const { country, abbreviation } = options.find(({ abbreviation }) => abbreviation === countryISO);

    if (country && abbreviation) {
      return `${country} - ${abbreviation}`;
    }
  }

  render() {
    const { error } = this.state;
    const { name, options, defaultValue } = this.props;
    const countryNames = options.map(({ country, abbreviation }) => `${country} - ${abbreviation}`);

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

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from 'styled-components';

import InputAmount from './InputAmount';

const InputFieldPresetsContainer = styled.div`
  .inputField {
    max-width: 8.75rem;
    margin: 0;
  }
  .form-group {
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0.65rem;
  }
`;

class InputFieldPresets extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.arrayOf(PropTypes.number),
    onChange: PropTypes.func,
    min: PropTypes.number,
    currency: PropTypes.currency,
  };

  constructor(props) {
    super(props);
    this.maxLength = 5;
    const values = props.defaultValue ? [...props.defaultValue] : [1000];
    this.state = { values };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.renderSingleInput = this.renderSingleInput.bind(this);
  }

  handleChange(index, val) {
    let { values } = this.state;
    values[index] = val;
    values = values.filter(v => v !== null);
    this.setState({ values }, () => this.onChange());
  }

  onChange() {
    this.props.onChange(this.state.values);
  }

  renderSingleInput(defaultValue, index) {
    return (
      <InputAmount
        key={`currency${index}`}
        name={`currency${index}`}
        id={`currency${index}`}
        currency={this.props.currency}
        currencyDisplay="CODE"
        value={this.state.values[index] ?? 0}
        min={this.props.min}
        onChange={val => this.handleChange(index, val)}
      />
    );
  }

  render() {
    const values = [...this.state.values];
    if (values.length < this.maxLength) {
      values.push(null);
    }
    return (
      <InputFieldPresetsContainer>
        <div className="flex flex-wrap gap-2">{values.map(this.renderSingleInput)}</div>
      </InputFieldPresetsContainer>
    );
  }
}

export default InputFieldPresets;

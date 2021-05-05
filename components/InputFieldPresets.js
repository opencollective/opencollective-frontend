import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from './Container';
import InputField from './InputField';

const InputFieldPresetsContainer = styled.div`
  .inputField {
    max-width: 14rem;
    margin: 0;
  }
  .form-group {
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 1rem;
  }
`;

class InputFieldPresets extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.arrayOf(PropTypes.number),
    pre: PropTypes.string,
    options: PropTypes.object,
    onChange: PropTypes.func,
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
      <InputField
        key={`currency${index}`}
        name={`currency${index}`}
        type="currency"
        defaultValue={defaultValue}
        value={this.state.values[index]}
        options={this.props.options}
        pre={this.props.pre}
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
        <Container display="flex">{values.map(this.renderSingleInput)}</Container>
      </InputFieldPresetsContainer>
    );
  }
}

export default InputFieldPresets;

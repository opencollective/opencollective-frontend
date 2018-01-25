import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import InputField from './InputField';

class InputFieldPresets extends React.Component {

  static propTypes = {
    defaultValue: PropTypes.arrayOf(PropTypes.number),
    pre: PropTypes.string,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    const values = props.defaultValue ? [ ...props.defaultValue] : [ 1000 ];
    this.state = { values };
    this.onChange = this.onChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.renderSingleInput = this.renderSingleInput.bind(this);
  }

  handleChange(index, val) {
    let { values } = this.state;
    values[index] = val;
    values = values.filter(v => v !== null);
    this.setState({ values });
    this.onChange();
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
        pre={this.props.pre}
        onChange={val => this.handleChange(index, val)}
        />
    )
  }

  render() {
    const values = [ ...this.state.values, null ];
    return (
      <div className="InputFieldPresets">
        <style jsx>{`
          .values {
            display: flex;
          }
          .InputFieldPresets :global(.inputField) {
            max-width: 14rem;
            margin: 0;
          }
          .InputFieldPresets :global(.form-group) {
            margin-bottom: 0;
            margin-left: 0;
            margin-right: 1rem;
          }
        `}</style>
        <div className="values">
          { values.map(this.renderSingleInput) }
        </div>
      </div>
    );
  }

}

export default InputFieldPresets;
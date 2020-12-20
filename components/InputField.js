import React from 'react';
import PropTypes from 'prop-types';
import { filter, get, isNil, map } from 'lodash';
import dynamic from 'next/dynamic';
import { Checkbox, Col, ControlLabel, FormControl, FormGroup, HelpBlock, InputGroup } from 'react-bootstrap';
import styled from 'styled-components';

import { capitalize } from '../lib/utils';

import InputSwitch from './InputSwitch';
import InputTypeCountry from './InputTypeCountry';
import InputTypeLocation from './InputTypeLocation';
import StyledInputTags from './StyledInputTags';
import TimezonePicker from './TimezonePicker';

// Dynamic imports: this components have a huge impact on bundle size and are externalized
// We use the DYNAMIC_IMPORT env variable to skip dynamic while using Jest
let HTMLEditor, DateTime;
if (process.env.DYNAMIC_IMPORT) {
  HTMLEditor = dynamic(() => import(/* webpackChunkName: 'HTMLEditor' */ './HTMLEditor'));
  DateTime = dynamic(() => import(/* webpackChunkName: 'DateTime' */ './DateTime'));
} else {
  HTMLEditor = require('./HTMLEditor').default;
  DateTime = require('./DateTime').default;
}

function FieldGroup({ controlId, label, help, pre, post, after, button, className, ...props }) {
  const validationState = props.validationState === 'error' ? 'error' : null;
  delete props.validationState;

  props.key = props.key || props.name;

  const inputProps = { ...props };
  delete inputProps.controlId;

  if (className && className.match(/horizontal/)) {
    return (
      <FormGroup controlId={controlId} validationState={validationState} className={className}>
        <Col componentClass={ControlLabel} sm={2}>
          {label}
        </Col>
        <Col sm={10}>
          <InputGroup>
            {pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
            <FormControl {...inputProps} />
            {post && <InputGroup.Addon>{post}</InputGroup.Addon>}
            {after && <div className="after">{after}</div>}
            {validationState && <FormControl.Feedback />}
            {button && <InputGroup.Button>{button}</InputGroup.Button>}
          </InputGroup>
          {help && <HelpBlock>{help}</HelpBlock>}
        </Col>
      </FormGroup>
    );
  } else {
    return (
      <FormGroup controlId={controlId} validationState={validationState} className={className}>
        {label && <ControlLabel>{label}</ControlLabel>}
        {(pre || button) && (
          <InputGroup>
            {pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
            <FormControl {...inputProps} ref={inputRef => inputRef && props.focus && inputRef.focus()} />
            {post && <InputGroup.Addon>{post}</InputGroup.Addon>}
            {validationState && <FormControl.Feedback />}
            {button && <InputGroup.Button>{button}</InputGroup.Button>}
          </InputGroup>
        )}
        {!pre && !post && !button && (
          <FormControl {...inputProps} ref={inputRef => inputRef && props.focus && inputRef.focus()} />
        )}
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }
}

const InputFieldContainer = styled.div`
  span.input-group {
    width: 100%;
  }
  .inputField {
    margin: 1rem 0;
  }
  .inputField,
  .inputField textarea {
    font-size: 1.6rem;
  }
  .horizontal .form-group label {
    margin-top: 5px;
  }
  .form-horizontal .form-group label {
    padding-top: 3px;
  }
  .inputField .checkbox label {
    width: auto;
  }
  .inputField input[type='number'] {
    text-align: right;
  }
  .inputField .currency input[type='number'] {
    text-align: left;
  }
  .inputField .switch {
    display: flex;
    align-items: center;
  }
  .archiveField {
    width: 100%;
    display: flex;
    padding-top: 20px;
  }
`;

class InputField extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    description: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object,
      PropTypes.bool,
      PropTypes.array,
    ]),
    validate: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]),
    context: PropTypes.object,
    placeholder: PropTypes.string,
    pre: PropTypes.string,
    post: PropTypes.string,
    button: PropTypes.node,
    className: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    required: PropTypes.bool,
    style: PropTypes.object,
    multiple: PropTypes.bool,
    closeOnSelect: PropTypes.bool,
    charCount: PropTypes.number,
    maxLength: PropTypes.number,
    step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    disabled: PropTypes.bool,
    timeFormat: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    focus: PropTypes.bool,
    help: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { value: props.value, validationState: null };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.setState({ value: this.props.value });
    }
  }

  validate(value) {
    if (!value) {
      return !this.props.required;
    }
    const type = this.props.type || 'text';
    if (this.props.validate && !type.match(/^date/)) {
      return this.props.validate(value);
    }
    switch (this.props.type) {
      case 'email':
        return value.match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        );
    }
    return true;
  }

  roundCurrencyValue(value) {
    if (value === null) {
      return null;
    } else if (get(this.props.options, 'step') === 1) {
      // Value must be an increment of 1, truncate the two last digits
      return Math.trunc(value / 100) * 100;
    }
    return value;
  }

  handleChange(value) {
    const { type, step } = this.props;
    if (type === 'number') {
      const parsed = step && parseFloat(step) !== 1 ? parseFloat(value) : parseInt(value);
      value = isNaN(parsed) ? null : parsed;
    } else if (type === 'currency') {
      value = this.roundCurrencyValue(value);
    }

    if (this.validate(value)) {
      this.setState({ validationState: null });
    } else {
      this.setState({ validationState: 'error' });
    }

    this.setState({ value });
    this.props.onChange(value);
  }

  render() {
    const field = this.props;
    const context = field.context || {};
    let value = this.state.value;
    const horizontal = field.className && field.className.match(/horizontal/);
    switch (this.props.type) {
      case 'textarea': {
        value = value || this.props.defaultValue || '';
        let after;
        if (field.charCount) {
          if (field.maxLength) {
            after = `${field.maxLength - value.length} characters left`;
          } else {
            after = `${value.length} characters`;
          }
        }
        this.input = (
          <FieldGroup
            label={capitalize(field.label)}
            componentClass="textarea"
            className={field.className}
            placeholder={this.props.placeholder}
            name={field.name}
            help={field.description}
            after={after}
            maxLength={field.maxLength}
            value={this.state.value || this.props.defaultValue || ''}
            onChange={event => this.handleChange(event.target.value)}
            disabled={field.disabled}
          />
        );
        break;
      }

      case 'tags':
        this.input = (
          <FormGroup>
            {horizontal && (
              <div>
                <Col componentClass={ControlLabel} sm={2}>
                  {capitalize(field.label)}
                </Col>
                <Col sm={10}>
                  <StyledInputTags
                    {...field}
                    renderUpdatedTags
                    onChange={entries => field.onChange(entries.map(e => e.value))}
                  />
                </Col>
              </div>
            )}
            {!horizontal && (
              <div>
                {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
                {field.description && <HelpBlock>{field.description}</HelpBlock>}
                <StyledInputTags
                  {...field}
                  renderUpdatedTags
                  onChange={entries => field.onChange(entries.map(e => e.value))}
                />
              </div>
            )}
          </FormGroup>
        );
        break;

      case 'date':
      case 'datetime': {
        const timeFormat = field.type === 'date' ? false : true;
        const { closeOnSelect } = this.props;

        this.input = (
          <FormGroup>
            {horizontal && (
              <div>
                <Col componentClass={ControlLabel} sm={2}>
                  {capitalize(field.label)}
                </Col>
                <Col sm={10}>
                  <DateTime
                    name={field.name}
                    timeFormat={field.timeFormat || timeFormat}
                    date={this.state.value || field.defaultValue}
                    timezone={context.timezone || 'utc'}
                    isValidDate={field.validate}
                    onChange={date => (date.toISOString ? this.handleChange(date.toISOString()) : false)}
                    closeOnSelect={closeOnSelect}
                  />
                </Col>
              </div>
            )}
            {!horizontal && (
              <div>
                {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
                <DateTime
                  name={field.name}
                  timeFormat={field.timeFormat || timeFormat}
                  date={this.state.value || field.defaultValue}
                  timezone={context.timezone || 'utc'}
                  isValidDate={field.validate}
                  onChange={date => (date.toISOString ? this.handleChange(date.toISOString()) : false)}
                  closeOnSelect={closeOnSelect}
                />
                {field.description && <HelpBlock>{field.description}</HelpBlock>}
              </div>
            )}
          </FormGroup>
        );
        break;
      }

      case 'component':
        this.input = (
          <FormGroup>
            {horizontal && (
              <div>
                <Col componentClass={ControlLabel} sm={2}>
                  {capitalize(field.label)}
                </Col>
                <Col sm={10}>
                  <field.component onChange={this.handleChange} {...field} {...field.options} />
                </Col>
              </div>
            )}
            {!horizontal && (
              <div>
                {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
                <field.component onChange={this.handleChange} {...field} {...field.options} />
                {field.description && <HelpBlock>{field.description}</HelpBlock>}
              </div>
            )}
          </FormGroup>
        );
        break;

      case 'location':
        this.input = (
          <FormGroup>
            {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
            <InputTypeLocation
              value={this.state.value || field.defaultValue}
              onChange={event => this.handleChange(event)}
              placeholder={field.placeholder}
              options={field.options}
            />
            {field.description && <HelpBlock>{field.description}</HelpBlock>}
          </FormGroup>
        );
        break;

      case 'country':
        this.input = (
          <FormGroup>
            {horizontal && (
              <div>
                <Col componentClass={ControlLabel} sm={2}>
                  {capitalize(field.label)}
                </Col>
                <Col sm={10}>
                  <InputTypeCountry
                    name={field.name}
                    value={field.value}
                    defaultValue={field.defaultValue}
                    onChange={this.handleChange}
                  />
                </Col>
              </div>
            )}
            {!horizontal && (
              <div>
                {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
                <InputTypeCountry
                  name={field.name}
                  value={field.value}
                  defaultValue={field.defaultValue}
                  onChange={this.handleChange}
                />
                {field.description && <HelpBlock>{field.description}</HelpBlock>}
              </div>
            )}
          </FormGroup>
        );
        break;

      case 'currency':
        value = value || field.defaultValue;
        value = typeof value === 'number' ? value / 100 : '';
        this.input = (
          <FieldGroup
            onChange={event => {
              return this.handleChange(event.target.value.length === 0 ? null : Math.round(event.target.value * 100));
            }}
            type="number"
            pre={field.pre}
            post={field.post}
            name={field.name}
            disabled={field.disabled}
            step={get(field, 'options.step') || '0.01'}
            min={(field.min || 0) / 100}
            label={typeof field.label === 'string' ? `${capitalize(field.label)}` : field.label}
            help={field.description}
            placeholder={field.placeholder}
            className={`currency ${field.className}`}
            onFocus={event => event.target.select()}
            value={value}
          />
        );
        break;

      case 'TimezonePicker':
        this.input = (
          <TimezonePicker
            label="Timezone"
            selectedTimezone={field.defaultValue}
            onChange={timezone => this.handleChange(timezone.value)}
          />
        );
        break;

      case 'select': {
        if (!field.options || field.options.length === 0) {
          console.warn('>>> InputField: options.length needs to be >= 1', field.options);
          return null;
        }

        const firstOptionValue =
          field.options[0].value !== undefined ? field.options[0].value : Object.keys(field.options[0])[0];

        this.input = (
          <FieldGroup
            key={`${field.name}-${firstOptionValue}`} // make sure we instantiate a new component if first value changes
            componentClass="select"
            type={field.type}
            name={field.name}
            label={field.label && `${capitalize(field.label)}`}
            help={field.description}
            placeholder={field.placeholder}
            className={field.className}
            autoFocus={field.focus}
            defaultValue={field.defaultValue || firstOptionValue}
            value={field.value}
            onChange={event =>
              field.multiple
                ? this.handleChange(map(filter(event.target.options, 'selected'), 'value'))
                : this.handleChange(event.target.value)
            }
            multiple={field.multiple}
            disabled={field.disabled}
          >
            {field.options &&
              field.options.map(option => {
                const value = option.value !== undefined ? option.value : Object.keys(option)[0];
                const label = option.label || option[value];
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
          </FieldGroup>
        );
        break;
      }

      case 'checkbox':
        this.input = (
          <FormGroup controlId={field.name}>
            {horizontal && (
              <div>
                <Col componentClass={ControlLabel} sm={2}>
                  {capitalize(field.label)}
                </Col>
                <Col sm={10}>
                  <Checkbox
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                  >
                    {field.description}
                  </Checkbox>
                </Col>
                {field.help && (
                  <Col sm={10} smOffset={2}>
                    <HelpBlock>{field.help}</HelpBlock>
                  </Col>
                )}
              </div>
            )}
            {!horizontal && (
              <div>
                {field.label && <ControlLabel>{capitalize(field.label)}</ControlLabel>}
                <Checkbox
                  defaultChecked={field.defaultValue}
                  onChange={event => this.handleChange(event.target.checked)}
                >
                  {field.description}
                </Checkbox>
              </div>
            )}
          </FormGroup>
        );
        break;

      case 'switch':
        this.input = (
          <FormGroup controlId={field.name} help={field.description}>
            {horizontal && (
              <React.Fragment>
                {field.label && (
                  <Col componentClass={ControlLabel} sm={2}>
                    {capitalize(field.label)}
                  </Col>
                )}
                <Col sm={10}>
                  <InputSwitch
                    name={field.name}
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Col>
              </React.Fragment>
            )}
            {!horizontal && (
              <React.Fragment>
                {field.label && <ControlLabel>{capitalize(field.label)}</ControlLabel>}
                <div className="switch">
                  <InputSwitch
                    name={field.name}
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </div>
              </React.Fragment>
            )}
          </FormGroup>
        );
        break;

      case 'html':
        this.input = (
          <div>
            {field.label && <ControlLabel>{capitalize(field.label)}</ControlLabel>}
            <HTMLEditor
              value={this.props.value}
              defaultValue={field.defaultValue}
              onChange={this.handleChange}
              className={field.className}
            />
          </div>
        );
        break;

      default: {
        this.input = (
          <FieldGroup
            onChange={event => this.handleChange(event.target.value)}
            type={field.type}
            pre={field.pre}
            post={field.post}
            button={field.button}
            name={field.name}
            maxLength={field.maxLength}
            disabled={field.disabled}
            label={field.label && `${capitalize(field.label)}`}
            help={field.description}
            autoFocus={field.focus}
            placeholder={field.placeholder}
            className={field.className}
            value={field.value}
            defaultValue={!isNil(field.defaultValue) ? field.defaultValue : ''}
            validationState={this.state.validationState}
            step={field.step}
            min={field.min}
            max={field.max}
          />
        );
        break;
      }
    }

    return (
      <InputFieldContainer
        className={`inputField ${this.props.className} ${this.props.name}`}
        key={`input-${this.props.name}`}
      >
        {this.input}
      </InputFieldContainer>
    );
  }
}

export default InputField;

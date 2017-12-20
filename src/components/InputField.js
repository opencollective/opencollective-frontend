import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { capitalize } from '../lib/utils';
import DateTime from 'react-datetime';
import stylesheet from '../styles/react-datetime.css';
import moment from 'moment-timezone';
import InputTypeDropzone from './InputTypeDropzone';
import InputTypeLocation from './InputTypeLocation';
import InputTypeCreditCard from './InputTypeCreditCard';
import { Col, HelpBlock, FormGroup, InputGroup, FormControl, ControlLabel, Checkbox } from 'react-bootstrap';

function FieldGroup({ controlId, label, help, pre, post, button, className, ...props }) {

  const validationState = props.validationState === 'error' ? 'error' : null;
  delete props.validationState;

  props.key = props.key || props.name;

  const inputProps = { ... props };
  delete inputProps.controlId;

  if (className === 'horizontal') {
    return (
      <FormGroup controlId={controlId} validationState={validationState}>
        <Col componentClass={ControlLabel} sm={3}>
          {label}
        </Col>
        <Col sm={9}>
          <InputGroup>
          { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
          <FormControl {...inputProps} />
          { post && <InputGroup.Addon>{post}</InputGroup.Addon>}
          { validationState && <FormControl.Feedback /> }
          { button && <InputGroup.Button>{button}</InputGroup.Button>}
          </InputGroup>
          {help && <HelpBlock>{help}</HelpBlock>}
        </Col>
      </FormGroup>
    );
  } else {
    return (
      <FormGroup controlId={controlId} validationState={validationState}>
        {label && <ControlLabel>{label}</ControlLabel>}
        { (pre || button) &&
          <InputGroup>
          { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
          <FormControl {...inputProps} ref={inputRef => inputRef && props.focus && inputRef.focus()} />
          { post && <InputGroup.Addon>{post}</InputGroup.Addon>}
          { validationState && <FormControl.Feedback /> }
          { button && <InputGroup.Button>{button}</InputGroup.Button>}
          </InputGroup>
        }
        { !pre && !post && !button &&
          <FormControl {...inputProps} ref={inputRef => inputRef && props.focus && inputRef.focus()} />
        }
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }
}

class InputField extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object, PropTypes.bool]),
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
    required: PropTypes.bool
  }

  constructor(props) {
    super(props);

    this.state = { value: props.value, validationState: null };
    this.handleChange = this.handleChange.bind(this);
    this.debouncedHandleChange = _.debounce(props.onChange, 500);

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
  }

  validate(value) {
    if (!value) return !this.props.required;
    if (this.props.validate && this.props.type !== 'datetime') {
      return this.props.validate(value);
    }
    switch (this.props.type) {
      case 'email':
        return value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }
    return true;
  }

  handleChange(value) {
    if (this.props.type === 'number') {
      value = parseInt(value) || null;
    }
    if (this.validate(value)) {
      this.setState({ validationState: null });
    } else {
      this.setState({ validationState: 'error' });
    }
    this.setState({value});
    this.debouncedHandleChange(value);
  }

  render() {

    const field = this.props;

    const context = field.context || {};

    switch (this.props.type) {
      case 'creditcard':
        this.input =  (<FormGroup controlId={field.name}>
                        {field.className === 'horizontal' &&
                          <div>
                            <Col componentClass={ControlLabel} sm={3}>
                              {capitalize(field.label)}
                            </Col>
                            <Col sm={9}>
                              <InputTypeCreditCard options={field.options} onChange={this.handleChange} />                   
                            </Col>
                          </div>
                        }
                        {field.className !== 'horizontal' &&
                          <div>
                            <ControlLabel>{capitalize(field.label)}</ControlLabel>
                            <InputTypeCreditCard onChange={this.handleChange} />                   
                          </div>
                        }
                      </FormGroup>)
        break;
      case 'textarea':
        this.input =  (<FieldGroup
                          label={capitalize(field.label)}
                          componentClass="textarea"
                          className={field.className}
                          placeholder={this.props.placeholder}
                          name={field.name}
                          help={field.help}
                          value={this.state.value || this.props.defaultValue}
                          onChange={event => this.handleChange(event.target.value)}
                        />
                      )
        break;
      case 'datetime':
        this.input = (
        <FormGroup>
          {field.className === 'horizontal' &&
            <div>
              <Col componentClass={ControlLabel} sm={3}>
                {capitalize(field.label)}
              </Col>
              <Col sm={9}>
                <DateTime
                  name={field.name}
                  value={moment.tz(new Date(this.state.value || field.defaultValue), context.timezone)}
                  isValidDate={field.validate}
                  onChange={date => this.handleChange(date.toISOString())}
                  />
              </Col>
            </div>
          }
          {field.className !== 'horizontal' &&
            <div>
              {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
              <DateTime
                name={field.name}
                value={moment.tz(new Date(this.state.value || field.defaultValue), context.timezone)}
                isValidDate={field.validate}
                onChange={date => this.handleChange(date.toISOString())}
                />
              {field.description && <HelpBlock>{field.description}</HelpBlock>}
            </div>
          }
        </FormGroup>
        )
        break;
      case 'component':
        this.input = (
        <FormGroup>
          {field.className === 'horizontal' &&
            <div>
              <Col componentClass={ControlLabel} sm={3}>
                {capitalize(field.label)}
              </Col>
              <Col sm={9}>
                <field.component onChange={this.handleChange} {...field.options} />
              </Col>
            </div>
          }
          {field.className !== 'horizontal' &&
            <div>
              {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
              <field.component onChange={this.handleChange} {...field.options} />
              {field.description && <HelpBlock>{field.description}</HelpBlock>}
            </div>
          }
        </FormGroup>
        )
        break;
      case 'location':
        this.input = (
        <FormGroup>
          {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
          <InputTypeLocation
            value={this.state.value}
            onChange={event => this.handleChange(event)}
            placeholder={field.placeholder}
            options={field.options}
            />
          {field.description && <HelpBlock>{field.description}</HelpBlock>}
        </FormGroup>
        )
        break;
      case 'dropzone':
        this.input = (
          <FormGroup>
          {field.className === 'horizontal' &&
            <div>
              <Col componentClass={ControlLabel} sm={3}>
                {capitalize(field.label)}
              </Col>
              <Col sm={9}>
                <InputTypeDropzone
                  value={this.state.value}
                  name={field.name}
                  onChange={event => this.handleChange(event)}
                  placeholder={field.placeholder}
                  options={field.options}
                  />
              </Col>
            </div>
          }
          {field.className !== 'horizontal' &&
            <div>
              {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
              <InputTypeDropzone
                value={this.state.value}
                name={field.name}
                onChange={event => this.handleChange(event)}
                placeholder={field.placeholder}
                options={field.options}
                />
              {field.description && <HelpBlock>{field.description}</HelpBlock>}
            </div>
          }
        </FormGroup>
        )
        break;

      case 'currency':
        this.input = (
        <FieldGroup
          onChange={event => this.handleChange(Math.round(event.target.value*100))}
          type="number"
          pre={field.pre}
          post={field.post}
          name={field.name}
          min={field.min / 100}
          label={field.label && `${capitalize(field.label)}`}
          help={field.description}
          placeholder={field.placeholder}
          className={field.className}
          onFocus={(event) => event.target.select()}
          value={this.state.value ? this.state.value / 100 : ''}
          defaultValue={(field.value || field.defaultValue || 0)/100}
        />
        )
        break;

      case 'select':
        this.input = (
          <FieldGroup
            componentClass="select"
            type={field.type}
            name={field.name}
            label={field.label && `${capitalize(field.label)}`}
            help={field.description}
            placeholder={field.placeholder}
            className={field.className}
            autoFocus={field.focus}
            value={field.value || field.defaultValue}
            onChange={event => this.handleChange(event.target.value)}
            >
            { field.options && field.options.map(option => {
              const value = Object.keys(option)[0];
              const label = option[value];
              return (<option key={value} value={value}>{label}</option>)
              })
            }
          </FieldGroup>)
        break;

      case 'checkbox':
        this.input =  (<FormGroup controlId={field.name}>
                        {field.className === 'horizontal' &&
                          <div>
                            <Col componentClass={ControlLabel} sm={3}>
                              {capitalize(field.label)}
                            </Col>
                            <Col sm={9}>
                              <Checkbox defaultChecked={field.defaultValue} onChange={event => this.handleChange(event.target.checked)}>{field.description}</Checkbox>
                            </Col>
                          </div>
                        }
                        {field.className !== 'horizontal' &&
                          <div>
                            <ControlLabel>{capitalize(field.label)}</ControlLabel>
                            <Checkbox defaultChecked={field.defaultValue} onChange={event => this.handleChange(event.target.checked)}>{field.description}</Checkbox>
                          </div>
                        }
                      </FormGroup>)
        break;

      default:
      this.input = (<FieldGroup
          onChange={event => this.handleChange(event.target.value)}
          type={field.type}
          pre={field.pre}
          post={field.post}
          button={field.button}
          name={field.name}
          disabled={field.disabled}
          label={field.label && `${capitalize(field.label)}`}
          help={field.description}
          autoFocus={field.focus}
          placeholder={field.placeholder}
          className={field.className}
          value={this.state.value || field.defaultValue}
          defaultValue={field.defaultValue}
          validationState={this.state.validationState}
        />)

        break;
    }

    return (
      <div className={`inputField ${this.props.className} ${this.props.name}`} key={`input-${this.props.name}`} >
        <style jsx global>{`
          span.input-group {
            width: 100%;
          }
          .inputField {
            margin: 1rem 0;
          }
          .inputField, .inputField textarea {
            font-size: 1.6rem;
          }
        `}</style>
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        {this.input}
      </div>
    );
  }
}

export default InputField;
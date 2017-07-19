import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { capitalize } from '../lib/utils';
import DateTime from 'react-datetime';
import stylesheet from '../styles/react-datetime.css';
import moment from 'moment-timezone';
import InputTypeLocation from './InputTypeLocation';
import InputTypeCreditCard from './InputTypeCreditCard';
import { Col, HelpBlock, FormGroup, InputGroup, FormControl, ControlLabel } from 'react-bootstrap';

function FieldGroup({ id, label, help, pre, className, ...props }) {

  const validationState = props.validationState === 'error' ? 'error' : null;
  delete props.validationState;

  if (className == 'horizontal') {
    return (
      <FormGroup controlId={id} validationState={validationState}>
        <Col componentClass={ControlLabel} sm={3}>
          {label}
        </Col>
        <Col sm={9}>
          <InputGroup>
          { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
          <FormControl {...props} />
          <FormControl.Feedback />
          </InputGroup>
          {help && <HelpBlock>{help}</HelpBlock>}
        </Col>
      </FormGroup>
    );
  } else {
    return (
      <FormGroup controlId={id} validationState={validationState}>
        <ControlLabel>{label}</ControlLabel>
        <InputGroup>
        { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
        <FormControl {...props} ref={inputRef => inputRef && props.focus && inputRef.focus()} />
        <FormControl.Feedback />
        </InputGroup>
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }
}

class InputField extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
    validate: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object),
    context: PropTypes.object,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func,
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
    if (this.props.validate) {
      return this.props.validate(value);
    }
    switch (this.props.type) {
      case 'email':
        return value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }
    return true;
  }

  handleChange(value) {
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
                          value={this.state.value || this.props.defaultValue}
                          onChange={event => this.handleChange(event.target.value)}
                        />
                      )
        break;
      case 'datetime':
        this.input = (
        <FormGroup>
          {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
          <DateTime
            name={field.name}
            value={moment.tz(new Date(this.state.value || field.defaultValue), context.timezone)}
            isValidDate={field.validate}
            onChange={date => this.handleChange(date.toISOString())} 
            />
          {field.description && <HelpBlock>{field.description}</HelpBlock>}
        </FormGroup>
        )
        break;
      case 'location':
        this.input = (
        <FormGroup>
          {field.label && <ControlLabel>{`${capitalize(field.label)}`}</ControlLabel>}
          <InputTypeLocation value={this.state.value} onChange={event => this.handleChange(event)} />
          {field.description && <HelpBlock>{field.description}</HelpBlock>}
        </FormGroup>
        )
        break;
      case 'currency':
        this.input = (
        <FieldGroup
          onChange={event => this.handleChange(event.target.value*100)}
          type={field.type}
          pre={field.pre}
          name={field.name}
          label={field.label && `${capitalize(field.label)}`}
          help={field.description}
          placeholder={field.placeholder}
          className={field.className}
          value={(this.state.value||0)/100}
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
            defaultValue={this.state.value || field.defaultValue}
            onChange={event => this.handleChange(event.target.value)}
            >
            {field.options.map(option => {
              const value = Object.keys(option)[0];
              const label = option[value];
              return (<option value={value}>{label}</option>)
              })
            }
          </FieldGroup>)
        break;

      default:
      this.input = (<FieldGroup
          onChange={event => this.handleChange(event.target.value)}
          type={field.type}
          pre={field.pre}
          name={field.name}
          label={field.label && `${capitalize(field.label)}`}
          help={field.description}
          autoFocus={field.focus}
          placeholder={field.placeholder}
          className={field.className}
          value={this.state.value || field.defaultValue}
          validationState={this.state.validationState}
        />)

        break;
    }

    return (
      <div className="field" key={`input-${this.props.name}`} >
        <style jsx>{`
          :global(span.input-group) {
            width: 100%;
          }
        `}</style>
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        {this.input}
      </div>
    );
  }
}

export default InputField;
import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import _ from 'lodash';
import { capitalize } from '../lib/utils';
import DateTime from 'react-datetime';
import stylesheet from '../styles/react-datetime.css';
import moment from 'moment-timezone';
import InputTypeLocation from './InputTypeLocation';
import { Col, HelpBlock, FormGroup, InputGroup, FormControl, ControlLabel } from 'react-bootstrap';

function FieldGroup({ id, label, help, pre, className, ...props }) {

  if (className == 'horizontal') {
    return (
      <FormGroup controlId={id}>
        <Col componentClass={ControlLabel} sm={2}>
          {label}
        </Col>
        <Col sm={10}>
          <InputGroup>
          { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
          <FormControl {...props} />
          </InputGroup>
          {help && <HelpBlock>{help}</HelpBlock>}
        </Col>
      </FormGroup>
    );
  } else {
    return (
      <FormGroup controlId={id}>
        <ControlLabel>{label}</ControlLabel>
        <InputGroup>
        { pre && <InputGroup.Addon>{pre}</InputGroup.Addon>}
        <FormControl {...props} />
        </InputGroup>
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }
}

class InputField extends React.Component {

  static propTypes = {
    name: PropTypes.string.required,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    context: PropTypes.object,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = { value: props.value };
    this.handleChange = this.handleChange.bind(this);
    this.debouncedHandleChange = _.debounce(props.onChange, 500);

    this.messages = defineMessages({
      'slug.label': { id: 'event.slug.label', defaultMessage: 'url' },
      'name.label': { id: 'event.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'event.amount.label', defaultMessage: 'amount' },
      'description.label': { id: 'event.description.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'event.startsAt.label', defaultMessage: 'start date and time' },
      'endsAt.label': { id: 'event.endsAt.label', defaultMessage: 'end date and time' },
      'location.label': { id: 'event.location.label', defaultMessage: 'location' }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
  }

  handleChange(value) {
    this.setState({value});
    this.debouncedHandleChange(value);
  }

  render() {

    const field = this.props;

    const context = field.context || {};

    const { intl } = this.props;

    switch (this.props.type) {
      case 'textarea':
        this.input =  (<FormGroup controlId={field.name}>
                        <ControlLabel>{capitalize(field.name)}</ControlLabel>
                        <FormControl componentClass="textarea" placeholder={this.props.placeholder} value={this.state.value || this.props.placeholder}  onChange={event => this.handleChange(event.target.value)} />
                      </FormGroup>)
        break;
      case 'datetime':
        this.input = (
        <FormGroup>
          {this.messages[`${field.name}.label`] && <ControlLabel>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</ControlLabel>}
          <DateTime value={moment.tz(new Date(this.state.value), context.timezone)} onChange={date => this.handleChange(date.toISOString())}  />
          {this.messages[`${field.name}.description`] && <HelpBlock>{intl.formatMessage(this.messages[`${field.name}.description`])}</HelpBlock>}
        </FormGroup>
        )
        break;
      case 'location':
        this.input = (
        <FormGroup>
          {this.messages[`${field.name}.label`] && <ControlLabel>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</ControlLabel>}
          <InputTypeLocation value={this.state.value} onChange={event => this.handleChange(event)} />
          {this.messages[`${field.name}.description`] && <HelpBlock>{intl.formatMessage(this.messages[`${field.name}.description`])}</HelpBlock>}
        </FormGroup>
        )
        break;
      case 'currency':
        this.input = (
        <FieldGroup
          id="formControlsText"
          onChange={event => this.handleChange(event.target.value*100)}
          type={field.type}
          pre={field.pre}
          label={this.messages[`${field.name}.label`] && `${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}
          help={this.messages[`${field.name}.description`] && intl.formatMessage(this.messages[`${field.name}.description`])}
          placeholder={field.placeholder}
          className={field.className}
          value={(this.state.value||0)/100}
        />
        )
        break;
      default:

      this.input = (<FieldGroup
          onChange={event => this.handleChange(event.target.value)}
          type={field.type}
          pre={field.pre}
          label={this.messages[`${field.name}.label`] && `${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}
          help={this.messages[`${field.name}.description`] && intl.formatMessage(this.messages[`${field.name}.description`])}
          placeholder={field.placeholder}
          className={field.className}
          value={this.state.value}
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

export default injectIntl(InputField);
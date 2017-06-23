import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { capitalize } from '../lib/utils';
import DateTime from 'react-datetime';
import stylesheet from '../styles/react-datetime.css';
import moment from 'moment-timezone';
import InputTypeLocation from './InputTypeLocation';

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
      'slug.label': { id: 'event.slug.label', defaultMessage: 'slug' },
      'name.label': { id: 'event.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'event.amount.label', defaultMessage: 'amount' },
      'description.label': { id: 'event.description.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'event.startsAt.label', defaultMessage: 'Start date and time' },
      'endsAt.label': { id: 'event.endsAt.label', defaultMessage: 'End date and time' },
      'location.label': { id: 'event.location.label', defaultMessage: 'Location' }
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
        this.input = <textarea onChange={event => this.handleChange(event.target.value)} value={this.state.value || this.props.placeholder} />;
        break;
      case 'datetime':
        this.input = <DateTime value={moment.tz(new Date(this.state.value), context.timezone)} onChange={date => this.handleChange(date.toISOString())}  />;
        break;
      case 'location':
        this.input = <InputTypeLocation value={this.state.value} onChange={event => this.handleChange(event)} />;
        break;
      case 'currency':
        this.input = <input type="text" value={(this.state.value||0)/100} placeholder={this.props.placeholder} onChange={event => this.handleChange(event.target.value*100)} />
        break;
      default:
        this.input = <input type="text" value={this.state.value} placeholder={this.props.placeholder} onChange={event => this.handleChange(event.target.value)} />
        break;
    }

    return (
      <div className="field" key={`input-${this.props.name}`} >
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        {this.messages[`${field.name}.label`] && <label>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</label>}
        {this.input}
        {this.messages[`${field.name}.description`] && <span className="description">{intl.formatMessage(this.messages[`${field.name}.description`])}</span>}
      </div>
    );
  }
}

export default injectIntl(InputField);
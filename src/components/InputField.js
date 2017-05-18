import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { capitalize } from '../lib/utils';

class InputField extends React.Component {

  static propTypes = {
    name: PropTypes.string.required,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = { value: null };
    this.handleChange = this.handleChange.bind(this);
    this.debouncedHandleChange = _.debounce(props.onChange, 500);

    this.messages = defineMessages({
      'slug.label': { id: 'createEvent.slug.label', defaultMessage: 'slug' },
      'name.label': { id: 'createEvent.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'createEvent.amount.label', defaultMessage: 'amount' },
      'description.label': { id: 'createEvent.description.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'createEvent.startsAt.label', defaultMessage: 'Start date and time' },
      'endsAt.label': { id: 'createEvent.endsAt.label', defaultMessage: 'End date and time' },
      'location.label': { id: 'createEvent.location.label', defaultMessage: 'location name' },
      'address.label': { id: 'createEvent.address.label', defaultMessage: 'address' }
    });

    switch (props.type) {
      case 'textarea':
        this.input = <textarea ref={props.name} onChange={this.handleChange}>{props.placeholder}</textarea>;
        break;
      default:
        this.input = <input type="text" value={props.value} ref={props.name} placeholder={props.placeholder} onChange={this.handleChange} />
        break;
    }

    // return this.input; 
  }

  handleChange(event) {
    const value = event.target.value;
    this.setState({value});
    this.debouncedHandleChange(value);
  }

  render() {

    const field = this.props;

    const { intl } = this.props;

    return (
      <div className="field" key={field.name} >
        {this.messages[`${field.name}.label`] && <label>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</label>}
        {this.input}
        {this.messages[`${field.name}.description`] && <span className="description">{intl.formatMessage(this.messages[`${field.name}.description`])}</span>}
      </div>
    );
  }
}

export default injectIntl(InputField);
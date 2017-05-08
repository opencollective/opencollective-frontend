import React from 'react';
import _ from 'lodash';
import { addEventsData } from '../graphql/queries';
import { addCreateEventMutation } from '../graphql/mutations';
import { defineMessages, injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import colors from '../constants/colors';
import Button from '../components/Button';
import { isValidEmail, capitalize } from '../lib/utils';

class CreateEvent extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  constructor(props) {
    super(props);
    this.state = { event: {}, result: {} };
    this.renderInputField = this.renderInputField.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    
    this.messages = defineMessages({
      'slug.label': { id: 'createEvent.slug.label', defaultMessage: 'slug' },
      'name.label': { id: 'createEvent.name.label', defaultMessage: 'name' },
      'description.label': { id: 'createEvent.description.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'createEvent.startsAt.label', defaultMessage: 'Start date and time' },
      'endsAt.label': { id: 'createEvent.endsAt.label', defaultMessage: 'End date and time' },
      'location.label': { id: 'createEvent.location.label', defaultMessage: 'location name' },
      'address.label': { id: 'createEvent.address.label', defaultMessage: 'address' }
    });

    this.fields = [
      {
        name: 'slug',
        placeholder: ''
      },
      {
        name: 'name',
        placeholder: ''
      },
      {
        name: 'description',
        placeholder: ''
      },
      {
        name: 'startsAt',
        placeholder: ''
      },
      {
        name: 'endsAt',
        placeholder: ''
      },
      {
        name: 'location',
        placeholder: ''
      },
      {
        name: 'address',
        placeholder: ''
      }
    ];  
  }

  async createEvent(EventInputType) {
    this.setState( { status: 'loading' });
    try {
      const event = await this.props.createEvent(EventInputType);
      const eventUrl = `${window.location.protocol}//${window.location.host}/${event.collective.slug}/events/${event.slug}`;
      this.setState({ status: 'idle', result: { success: `Event created with success: ${eventUrl}` }});
    } catch (err) {
      debugger;
      console.error(">>> createEvent error: ", err);
      const errorMsg = (err.graphQLErrors) ? err.graphQLErrors[0].message : err.message;
      this.setState( { result: { error: errorMsg }})
      throw new Error(errorMsg);
    }

  }

  renderEventEntry(event) {
    return (<option key={event.id} value={event.id}>{event.name}</option>);    
  }

  handleChange(fieldname, value) {
    const event = this.state.event;
    event[fieldname] = value;
    this.setState( { event });
  }

  handleTemplateChange(e) {
    const eventId = Number(e.target.value);
    const template = eventId ? this.props.data.allEvents.find(event => event.id === eventId) : {};
    console.log(">>> handleTemplateChange", eventId, template);
    this.fields.map(field => {
      this.refs[field.name].value = template[field.name] || '';
    })
    this.setState({event: template});
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.createEvent(this.state.event);
  }

  renderInputField(field) {

    const debouncedHandleEvent = _.debounce(this.handleChange, 500);
    const { intl } = this.props;

    return (
      <div className="field" key={field.name} >
        {this.messages[`${field.name}.label`] && <label>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</label>}
        <input type="text" ref={field.name} placeholder={field.placeholder} onChange={(event) => debouncedHandleEvent(field.name, event.target.value)} />
        {this.messages[`${field.name}.description`] && <span className="description">{intl.formatMessage(this.messages[`${field.name}.description`])}</span>}
      </div>
    );
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) return (<div />);

    return (
      <div>
        <h1>Create event</h1>
        <h2><FormattedMessage id='createEvent.template' defaultMessage="Template" /></h2>
        <form onSubmit={this.handleSubmit}>
          <select name="template" onChange={this.handleTemplateChange}>
            <option value="">No template</option>
            {allEvents.map(this.renderEventEntry)}
          </select>
          <div>
            {this.fields.map(this.renderInputField)}
          </div>
          <div>
            <Button type="submit" className="green" label="Create Event" />
          </div>
          <div className="result">
            <div className="success">{this.state.result.success}</div>
            <div className="error">{this.state.result.error}</div>
          </div>
        </form>
      </div>
    );
  }

}

export default addCreateEventMutation(addEventsData(injectIntl(CreateEvent)));
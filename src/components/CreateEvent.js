import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { addEventsData } from '../graphql/queries';
import { addCreateEventMutation } from '../graphql/mutations';
import { injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import colors from '../constants/colors';
import Button from '../components/Button';
import InputField from '../components/InputField';
import EditTiers from '../components/EditTiers';
import { isValidEmail, capitalize } from '../lib/utils';

class CreateEvent extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  constructor(props) {
    super(props);
    this.state = { event: {}, tiers: [{}, {}], result: {} };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTiersChange = this.handleTiersChange.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    
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
        type: 'textarea',
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

  handleTiersChange(tiers) {
    console.log(">>> handleTiersChange", tiers);
    this.setState({tiers});
  }

  handleTemplateChange(e) {
    const eventId = Number(e.target.value);
    const template = eventId ? this.props.data.allEvents.find(event => event.id === eventId) : {};
    console.log(">>> handleTemplateChange", eventId, template);
    const self = this;
    debugger;
    this.fields = this.fields.map(field => {
      // this.refs[field.name].value = template[field.name];
      field.value = template[field.name];
      return field;
    });
    this.setState({event: template, tiers: template.tiers});
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.createEvent(this.state.event);
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) return (<div />);
    console.log(">>> this.state.tiers", this.state.tiers);
    return (
      <div className="CreateEvent">
        <style jsx>{`
        :global(.field) {
          margin: 1rem;
        }
        :global(label) {
          width: 150px;
          display: inline-block;
          vertical-align: top;
        }
        :global(input), select, :global(textarea) {
          width: 300px;
          font-size: 1.5rem;
        }

        form {
          max-width: 700px;
          margin: 0 auto;
        }

        .FormInputs {
          column-count: 2;
        }

        .actions {
          margin: 5rem auto;
          text-align: center;
        }
        `}</style>

        <Header title="Create Event" />

        <Body>

          <h1>Create event</h1>
          <form onSubmit={this.handleSubmit}>
            <div className="FormInputs">
              <div className="field">
                <label>Template</label>
                <select name="template" onChange={this.handleTemplateChange}>
                  <option value="">No template</option>
                  {allEvents.map(this.renderEventEntry)}
                </select>
              </div>
              {/*{this.fields.map((field) => <input type="text" ref={field.name} name={field.name} placeholder={field.placeholder} onChange={e => this.handleChange(e.target.value)} />)}*/}

              {this.fields.map((field) => <InputField value={field.value} ref={field.name} name={field.name} placeholder={field.placeholder} type={field.type} onChange={this.handleChange} />)}
            </div>
            <EditTiers tiers={this.state.tiers} onChange={this.handleTiersChange} />
            <div className="actions">
              <Button type="submit" className="green" label="Create Event" />
              <div className="result">
                <div className="success">{this.state.result.success}</div>
                <div className="error">{this.state.result.error}</div>
              </div>
            </div>
          </form>

          </Body>

          <Footer />
      </div>
    );
  }

}

export default addCreateEventMutation(addEventsData(CreateEvent));
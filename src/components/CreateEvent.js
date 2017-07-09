import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { addCreateEventMutation } from '../graphql/mutations';
import moment from 'moment-timezone';
import EventTemplatePicker from '../components/EventTemplatePicker';
import EditEventForm from '../components/EditEventForm';
import { Button } from 'react-bootstrap';

class CreateEvent extends React.Component {

  static propTypes = {
    collective: PropTypes.object
  }

  constructor(props) {
    super(props);
    const timezone = moment.tz.guess();
    this.state = { event: { 
      collective: props.collective,
      timezone, // "Europe/Brussels", // "America/New_York"
    }, result: {} };
    this.createEvent = this.createEvent.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
  }

  async createEvent(EventInputType) {
    this.setState( { status: 'loading' });
    console.log(">>> createEvent", EventInputType);
    try {
      const res = await this.props.createEvent(EventInputType);
      const event = res.data.createEvent;
      const eventUrl = `${window.location.protocol}//${window.location.host}/${event.collective.slug}/events/${event.slug}`;
      this.setState({ status: 'idle', result: { success: `Event created with success: ${eventUrl}` }});
      window.location.replace(eventUrl);
    } catch (err) {
      console.error(">>> createEvent error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  async handleTemplateChange(event) {
    delete event.id;
    this.setState({event, tiers: event.tiers});
  }

  render() {

    const canCreateEvent = this.props.LoggedInUser && this.props.LoggedInUser.canCreateEvent;

    const collective = this.props.collective || {};
    const title = `Create a New ${collective.name} Event`;

    return (
      <div className="CreateEvent">
        <style jsx>{`
          .result {
            text-align: center;
            margin-bottom: 5rem;
          }
          .success {
            color: green;
          }
          .error {
            color: red;
          }
          .EventTemplatePicker {
            max-width: 700px;
            margin: 0 auto;
          }
          .EventTemplatePicker .field {
            margin: 1rem;
          }

          .login {
            margin: 0 auto;
            text-align: center;
          }
        `}</style>

        <Header
          title={title}
          LoggedInUser={this.props.LoggedInUser}
          />

        <Body>

          <h1>{title}</h1>

          {!canCreateEvent &&
            <div className="login">
              <p>You need to be logged in as a member of this collective to be able to create an event.</p>
              <p><Button bsStyle="primary" href={`/${collective.slug}#support`}>Become a member</Button> <Button bsStyle="default" href={`/login?next=${collective.slug}/events/new`}>Login</Button></p>
            </div>
          }
          {canCreateEvent &&
            <div>
              <div className="EventTemplatePicker">
                <div className="field">
                  <EventTemplatePicker label="Template" collectiveSlug={collective.slug} onChange={this.handleTemplateChange} />
                </div>
              </div>

              <EditEventForm event={this.state.event} onSubmit={this.createEvent} />
              <div className="result">
                <div className="success">{this.state.result.success}</div>
                <div className="error">{this.state.result.error}</div>
              </div>
            </div>
          }
          </Body>

          <Footer />
      </div>
    );
  }

}

export default addCreateEventMutation(CreateEvent);
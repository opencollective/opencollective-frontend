import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { addCreateCollectiveMutation } from '../graphql/mutations';
import moment from 'moment-timezone';
import EventTemplatePicker from '../components/EventTemplatePicker';
import EditEventForm from '../components/EditEventForm';
import CollectiveCover from '../components/CollectiveCover';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

class CreateEvent extends React.Component {

  static propTypes = {
    parentCollective: PropTypes.object
  }

  constructor(props) {
    super(props);
    const timezone = moment.tz.guess();
    this.state = { event: { 
      parentCollective: props.parentCollective,
      timezone, // "Europe/Brussels", // "America/New_York"
    }, result: {} };
    this.createEvent = this.createEvent.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg }})
  }

  resetError() {
    this.error();
  }

  async createEvent(EventInputType) {
    const { parentCollective } = this.props;
    this.setState( { status: 'loading' });
    EventInputType.type = 'EVENT';
    EventInputType.ParentCollectiveId = parentCollective.id;
    console.log(">>> createEvent", EventInputType);
    try {
      const res = await this.props.createCollective(EventInputType);
      const event = res.data.createCollective;
      const eventUrl = `${window.location.protocol}//${window.location.host}/${parentCollective.slug}/events/${event.slug}`;
      this.setState({ status: 'idle', result: { success: `Event created successfully: ${eventUrl}` }});
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
    delete event.slug;
    this.setState({ event, tiers: event.tiers });
  }

  render() {
    const { parentCollective, LoggedInUser } = this.props;
    const canCreateEvent = LoggedInUser && LoggedInUser.canEditCollective(parentCollective);

    const collective = parentCollective || {};
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
            margin: 0;
          }
          .login {
            margin: 0 auto;
            text-align: center;
          }
        `}</style>

          <Header
            title={title}
            description={collective.description}
            twitterHandle={collective.twitterHandle}
            image={collective.image || collective.backgroundImage}
            className={this.state.status}
            LoggedInUser={this.props.LoggedInUser}
            />

          <Body>

          <CollectiveCover
            href={`/${collective.slug}`}
            title={title}
            collective={collective}
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content" >

            {!canCreateEvent &&
              <div className="login">
                <p><FormattedMessage id="events.create.login" defaultMessage="You need to be logged in as a core contributor of this collective to be able to create an event." /></p>
                <p><Button bsStyle="primary" href={`/signin?next=/${collective.slug}/events/new`}><FormattedMessage id="login.button" defaultMessage="login" /></Button></p>
              </div>
            }
            {canCreateEvent &&
              <div>
                <div className="EventTemplatePicker">
                  <div className="field">
                    <EventTemplatePicker label="Template" collectiveSlug={collective.slug} onChange={this.handleTemplateChange} />
                  </div>
                </div>

                <EditEventForm event={this.state.event} onSubmit={this.createEvent} onChange={this.resetError} />
                <div className="result">
                  <div className="success">{this.state.result.success}</div>
                  <div className="error">{this.state.result.error}</div>
                </div>
              </div>
            }
          </div>
          </Body>

          <Footer />
      </div>
    );
  }

}

export default addCreateCollectiveMutation(CreateEvent);
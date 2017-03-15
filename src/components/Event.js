import React from 'react'
import EventHeader from '../components/EventHeader';
import ActionBar from '../components/ActionBar';
import NotFound from '../components/NotFound';
import Map from '../components/Map';
import Api from '../lib/api';
import HashLink from 'react-scrollchor';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import TopBar from '../components/TopBar';
import GetTicketForm from '../components/GetTicketForm';
import InterestedForm from '../components/InterestedForm';
import Responses from '../components/Responses';
import colors from '../constants/colors';
import { filterCollection } from '../lib/utils';
import '../styles/EventPage.css';
import { addEventData } from '../graphql/queries';
import { addCreateResponseMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import TicketsConfirmed from '../components/TicketsConfirmed';
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Event extends React.Component {

  static propTypes = {
    collectiveSlug: React.PropTypes.string.required,
    eventSlug: React.PropTypes.string.required,
    data: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.setInterested = this.setInterested.bind(this);
    this.updateResponse = this.updateResponse.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleGetTicketClick = this.handleGetTicketClick.bind(this);
    this.rsvp = this.rsvp.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.defaultActions = [
      {
        label: (<FormattedMessage id='actions.interested' defaultMessage='interested' />),
        // className: 'selected', 
        // icon: 'star',
        onClick: this.setInterested
      },
      {
        className: 'whiteblue',
        component: <HashLink to="#tickets"><FormattedMessage id='actions.GetTicket' defaultMessage='get ticket' /></HashLink>
      }
    ];

    this.state = {
      view: 'default',
      showInterestedForm: false,
      response: {},
      api: { status: 'idle' },
      actions: this.defaultActions
    };

    this.api = new Api({
      onChange: (apiStatus) => this.setState({ api: apiStatus }),
      delay: 5000
    });
  }

  /**
   * If user is logged in, we directly create a response 
   * Otherwise, we show the form to enter an email address
   */
  async setInterested(user) {
    if (user || this.user) {
      this.setState({ showInterestedForm: false });
      const tokens = user.email.substr(0, user.email.indexOf('@')).split('.');
      user.firstName = tokens[0] || '';
      user.lastName = tokens[1] || '';
      const response = {
        status: 'INTERESTED',
        user
      };
      try {
        await this.createResponse(response);
        this.event.responses.push(response);
        const actions = this.state.actions;
        actions[0].className = 'selected';
        actions[0].icon = 'star';
        this.setState({ actions, showInterestedForm: false });
      } catch (e) {
        this.error(`An error occured 😳. We couldn't register you as interested. Please try again in a few.`);
      }
      return;
    } else {
      this.setState({ showInterestedForm: !this.state.showInterestedForm });
      return;
    }
  }

  async rsvp(response) {
    try {
      await this.createResponse(response);
      this.setState({ response, view: 'default', modal: 'TicketsConfirmed' });
      window.scrollTo(0,0);
    } catch (e) {
      this.error(`An error occured 😳. We couldn't register you. Please try again in a few.`);
    }
  }

  closeModal() {
    this.setState({ modal: null });
  }

  changeView(view) {
    let actions;
    switch (view) {
      case 'GetTicket':
        actions = [{
          label: (<FormattedMessage id='actions.GoBack' defaultMessage={`go back`} />),
          onClick: this.resetResponse
        }];
        break;
      default:
        actions = this.defaultActions;
        break;
    }
    this.setState({view, actions});
    window.scrollTo(0,0);
  }

  async createResponse(response) {
    response.tier = response.tier || {};
    const ResponseInputType = {
      group: { slug: this.event.collective.slug },
      event: { slug: this.event.slug },
      tier: { id: response.tier.id },
      quantity: response.quantity,
      user: response.user,
      status: response.status
    };

    this.setState( { status: 'loading' });
    try {
      await this.props.createResponse(ResponseInputType);
      this.setState( { status: 'idle' });
    } catch (err) {
      console.error(">>> createResponse error: ", err);
      throw new Error(err.graphQLErrors[0].message);
    }
  }

  error(msg) {
    this.setState( {status: 'error', error: msg });
    setTimeout(() => {
      this.setState( { status: 'idle', error: null });
    }, 5000);
  }

  updateResponse(response) {
    this.setState({ response });
  }

  resetResponse() {
    this.setState({ response: {} });
    this.changeView('default');
  }

  handleGetTicketClick(response) {
    this.setState({ response, showInterestedForm: false });
    this.changeView('GetTicket');
  }

  render () {
    console.log("new state:", this.state, this.state.response);
    const { Event, error } = this.props.data;

    if ( error ) {
      console.error(error.message);
      return (<div>GraphQL error</div>)
    }

    console.log(">>> data", this.props.data);

    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }

    if (!this.props.data.Event) {
      return (<NotFound />)
    }

    this.event = Event;
    const going = filterCollection(Event.responses, {'status':'YES'});
    const interested = filterCollection(Event.responses, {'status':'INTERESTED'});

    const info = (
      <HashLink to="#location">
        <FormattedDate value={Event.startsAt} weekday='short' day='numeric' month='long' />, &nbsp;
        <FormattedTime value={Event.startsAt}  />&nbsp; - &nbsp;
        {Event.location}
      </HashLink>
    );

    return (
      <div>
        <TicketsConfirmed
          show={this.state.modal === 'TicketsConfirmed'}
          onClose={this.closeModal}
          event={this.event}
          response={this.state.response} />

        <div className={`EventPage ${this.state.modal && 'showModal'}`}>
          <TopBar className={this.state.status} />

          <NotificationBar status={this.state.status} error={this.state.error} />

          {this.state.view === 'default' &&
            <EventHeader
              logo={Event.collective.logo}
              title={Event.name}
              backgroundImage={Event.backgroundImage || Event.collective.backgroundImage || defaultBackgroundImage}
              />
          }

          <ActionBar
            actions={this.state.actions}
            info={info}
            />

          {this.state.showInterestedForm &&
            <InterestedForm onSubmit={this.setInterested} />
          }

          {this.state.view == 'GetTicket' &&
            <GetTicketForm
              onCancel={this.resetResponse}
              onSubmit={this.rsvp}
              quantity={this.state.response.quantity}
              stripePublishableKey={this.event.collective.stripePublishableKey}
              tier={this.state.response.tier || Event.tiers[0]}
              />
          }

          {this.state.view == 'default' &&
            <div>
              <div className="content" >
                <div className="eventDescription" >
                  <Markdown source={Event.description} />
                </div>

                <div id="tickets">
                  {Event.tiers.map((tier) =>
                    <Tier
                      key={tier.id}
                      className="tier"
                      tier={tier}
                      onChange={(response) => this.updateResponse(response)}
                      onClick={(response) => this.handleGetTicketClick(response)}
                      />
                  )}
                </div>
              </div>

              <section id="location" className="location">
                <div className="description">
                  <h1>Location</h1>
                  <div className="name">{Event.location}</div>
                  <div className="address" style={{color: colors.darkgray}}><a href={`http://maps.apple.com/?q=${Event.lat},{Event.long}`} target="_blank">{Event.address}</a></div>
                </div>
                { Event.lat && Event.long &&
                  <div className="map">
                    <Map lat={Event.lat} lng={Event.long} />
                  </div>
                }
              </section>

              { Event.responses.length > 0 &&
                <section id="responses">
                  <h1>
                    <FormattedMessage id='event.responses.title.going' values={{n: going.length}} defaultMessage={`{n} {n, plural, one {person going} other {people going}}`} />
                    { interested.length > 0 &&
                      <span>
                        <span> - </span>
                        <FormattedMessage id='event.responses.title.interested' values={{n: interested.length}} defaultMessage={`{n} interested`} />
                      </span>
                    }
                  </h1>
                  <Responses responses={Event.responses} />
                </section>
              }

            </div>
          }

        </div>
      </div>
    )
  }
}

const EventWithDataWithMutation = addCreateResponseMutation(addEventData(Event));

export default EventWithDataWithMutation;

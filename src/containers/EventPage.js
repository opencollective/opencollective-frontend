import React from 'react'
import { Link } from 'react-router'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { css } from 'glamor';
import EventHeader from '../components/EventHeader';
import ActionBar from '../components/ActionBar';
import Map from '../components/Map';
import Api from '../lib/api';
import HashLink from 'react-scrollchor';
import SignInUp from '../components/SignInUp';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import TopBar from '../components/TopBar';
import GetTicketForm from '../components/GetTicketForm';
import InterestedForm from '../components/InterestedForm';
import Responses from '../components/Responses';
import colors from '../constants/colors';
import { filterCollection } from '../lib/utils';
import '../css/EventPage.css';

class EventPage extends React.Component {

  static propTypes = {
    data: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.setInterested = this.setInterested.bind(this);
    this.updateResponse = this.updateResponse.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleGetTicketClick = this.handleGetTicketClick.bind(this);
    this.rsvp = this.rsvp.bind(this);

    this.defaultActions = [
      {
        label: 'interested',
        // className: 'selected', 
        // icon: 'star',
        onClick: this.setInterested
      },
      {
        className: 'whiteblue',
        component: <HashLink to="#tickets">get ticket</HashLink>
      }
    ];

    this.state = {
      view: 'default',
      showInterestedForm: false,
      response: {},
      api: { status: 'idle' },
      actions: this.defaultActions
    };

    setTimeout(() => {
      // this.setState({api: { status: 'error', error: "API is unreachable, please try again later"}});
    }, 1000);
    
    this.api = new Api({
      onChange: (apiStatus) => this.setState({ api: apiStatus }),
      delay: 5000
    });
  }

  async setInterested(response) {
    if (!this.user) {
      this.setState({ showInterestedForm: !this.state.showInterestedForm });
      return;
    }
    this.setState({ showInterestedForm: false });
    this.saveResponse(response);
  }

  rsvp(response) {
    this.setState({ view: 'ticketConfirmed' });
    this.saveResponse(response);
  }

  changeView(view) {
    let actions;
    switch(view) {
      case 'GetTicket':
        actions = [{
          label: 'Get another ticket',
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

  async saveResponse(response) {
    await this.api.saveResponse(response);
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
    const { getEvent, error } = this.props.data;

    if ( error ) {
      console.error(error.message);
      return (<div>GraphQL error</div>)
    }

    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }

    const Event = getEvent;
    const going = filterCollection(Event.responses, {'status':'confirmed'});
    const interested = filterCollection(Event.responses, {'status':'interested'});
    let responsesTitle = `${going.length} people going`;
    if (interested.length > 0)
      responsesTitle += ` – ${interested.length} interested`;

    return (
      <div className="EventPage">
        <TopBar className={this.state.api.status} /> 

        <NotificationBar status={this.state.api.status} error={this.state.api.error} />

        <EventHeader
          logo={Event.collective.logo}
          title={Event.name}
          backgroundImage={Event.backgroundImage || Event.collective.backgroundImage}
          />

        <ActionBar actions={this.state.actions} />
        {this.state.showInterestedForm &&
          <InterestedForm event={Event} onSubmit={(response) => this.saveResponse(response)} />
        }

        {this.state.view == 'GetTicket' && 
          <GetTicketForm
            onCancel={this.resetResponse}
            onSubmit={this.rsvp}
            quantity={this.state.response.quantity}
            tier={this.state.response.tier || Event.tiers[0]}
            />
        }

        {this.state.view == 'default' &&
          <div>
            <div className="content" >
              <div className="eventDescription" >
                {Event.description}
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
                <div className="address" style={{color: colors.darkgray}}>{Event.address}</div>
              </div>
              <div className="map">
                <Map lat={Event.lat} lng={Event.lng} />
              </div>
            </section>

            <section id="responses">
              <h1>{responsesTitle}</h1>
              <Responses responses={Event.responses} />
            </section>

          </div>
        }

      </div>
    )
  }
}

const FeedQuery = gql`query Event {
  getEvent(collectiveSlug: "opencollective", eventSlug: "jan-meetup") {
    id,
    name,
    description,
    locationString,
    tiers {
      id,
      name,
      description,
      amount,
      currency,
      quantity
    },
    collective {
      id,
      slug,
      name,
      mission,
      backgroundImage,
      logo
    },
    responses {
      quantity,
      status,
      user {
        name,
        avatar
      },
      tier {
        name
      }
    }
  }
}`

const EventPageWithData = graphql(FeedQuery)(EventPage)

export default EventPageWithData

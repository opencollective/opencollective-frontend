import React from 'react'
import { Link } from 'react-router'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { css } from 'glamor';
import EventHeader from '../components/EventHeader';
import ActionBar from '../components/ActionBar';
import NotFound from '../components/NotFound';
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
import defaultBackgroundImage from '../images/defaultBackgroundImage.png';
import { addEventData } from '../graphql/queries';
import { addCreateResponseMutation } from '../graphql/mutations';

class Event extends React.Component {

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

  /**
   * If user is logged in, we directly create a response 
   * Otherwise, we show the form to enter an email address
   */
  setInterested(user) {
    if (user || this.user) {
      this.setState({ showInterestedForm: false });
      this.createResponse({
        status: 'INTERESTED',
        user
      });
      this.setState({ showInterestedForm: false });
      return;
    } else {
      this.setState({ showInterestedForm: !this.state.showInterestedForm });
      return;
    }
  }

  rsvp(response) {
    this.setState({ view: 'ticketConfirmed' });
    this.createResponse(response);
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

  async createResponse(response) {
    response.tier = { id : response.tier && response.tier.id || 1 } // should remove default tier id
    const ResponseInputType = {
      group: { slug: this.event.collective.slug },
      event: { slug: this.event.slug },
      tier: response.tier,
      quantity: response.quantity || 1, // should remove || 1
      user: response.user,
      status: response.status
    };

    this.setState( { status: 'loading' });
    let result;
    try {
      result = await this.props.createResponse(ResponseInputType);
      this.setState( { status: 'idle' });
    } catch(err) {
      console.error(">>> createResponse error: ", err);
      this.error(err.graphQLErrors[0].message);
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
    const going = filterCollection(Event.responses, {'status':'confirmed'});
    const interested = filterCollection(Event.responses, {'status':'interested'});
    let responsesTitle = `${going.length} people going`;
    if (interested.length > 0)
      responsesTitle += ` – ${interested.length} interested`;

    return (
      <div className="EventPage">
        <TopBar className={this.state.status} /> 

        <NotificationBar status={this.state.status} error={this.state.error} />

        <EventHeader
          logo={Event.collective.logo}
          title={Event.name}
          backgroundImage={Event.backgroundImage || Event.collective.backgroundImage || defaultBackgroundImage}
          />

        <ActionBar actions={this.state.actions} />
        {this.state.showInterestedForm &&
          <InterestedForm onSubmit={this.setInterested} />
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

const EventWithDataWithMutation = addCreateResponseMutation(addEventData(Event));

export default EventWithDataWithMutation;

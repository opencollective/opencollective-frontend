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
import colors from '../constants/colors';

import '../css/EventPage.css';

const styles = {
  EventPage: css({
    position: 'relative',
    '& a': {
      textDecoration: 'none'
    },
    '& section': {
      margin: '60px 0px',
    },
    '& h1': {
      margin: '40px 0px 20px',
      fontFamily: 'montserratlight',
      fontSize: '20pt',
      fontWeight: 'bold'
    }
  }),
  content: css({
    maxWidth: 960,
    margin: '0 auto'
  }),
  description: css({
    margin: '1rem'
  }),
  getTicketForm: css({
    margin: '20px auto',
    maxWidth: '400px'
  }),
  map: css({
    border: '1px solid #eee',
    height: '300px'
  }),
  tier: css({
    margin: '40px auto'
  }),
  location: css({
    textAlign: 'center',
    '& .description': {
      margin: '30px 10px'
    },
    '& .name': {
      fontSize: '16pt',
      fontFamily: 'montserratlight',
      margin: '5px 0px'
    },
    '& .address': {
      color: colors.darkgray,
      fontFamily: 'lato'
    }
  })
};

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
        onClick: this.setInterested
      },
      {
        className: 'whiteblue',
        component: <HashLink to="#tickets">get ticket</HashLink>
      }
    ];

    this.state = {
      view: 'event',
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
    this.changeView('event');
  }

  handleGetTicketClick(response) {
    this.setState({ response, showInterestedForm: false });
    this.changeView('GetTicket');
  }

  render () {
    console.log("new state:", this.state, this.state.response);
    const { Event } = this.props.data;
    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }
    return (
      <div className={styles.EventPage}>
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

        {this.state.view == 'event' &&
          <div>
            <div className={styles.content} >
              <div className={styles.description} >
                {Event.description}
              </div>

              <div id="tickets">
                {Event.tiers.map((tier) =>
                  <Tier
                    key={tier.id}
                    className={styles.tier}
                    tier={tier}
                    onChange={(response) => this.updateResponse(response)}
                    onClick={(response) => this.handleGetTicketClick(response)}
                    />
                )}
              </div>
            </div>

            <section id="location" className={styles.location}>
              <div className="description">
                <h1>Location</h1>
                <div className="name">{Event.location}</div>
                <div className="address">{Event.address}</div>
              </div>
              <div className={styles.map}>
                <Map lat={Event.lat} lng={Event.lng} className={styles.map} />
              </div>
            </section>
          </div>
        }
      </div>
    )
  }
}

const FeedQuery = gql`query Event {
  Event(id:"ciwidswi31qwy0145gdniopt8") {
    id,
    name,
    description,
    location,
    address,
    lat,
    lng,
    backgroundImage,
    tiers {
      id,
      name,
      description,
      amount,
      currency,
      maxQuantity
    },
    collective {
      id,
      slug,
      name,
      mission,
      backgroundImage,
      logo
    }
  }
}`

const EventPageWithData = graphql(FeedQuery)(EventPage)

export default EventPageWithData

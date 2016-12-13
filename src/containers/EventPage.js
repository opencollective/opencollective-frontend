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

const styles = {
  EventPage: css({
    position: 'relative',
    '& a': {
      textDecoration: 'none'
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

    const actions = [
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
      actions
    };

    setTimeout(() => {
      // this.setState({api: { status: 'error', error: "API is unreachable, please try again later"}});
    }, 1000);
    
    this.api = new Api({
      onChange: (apiStatus) => this.setState({ api: apiStatus }),
      delay: 5000
    });
  }

  async setInterested(user, event) {
    if (!user) {
      this.setState({ showInterestedForm: !this.state.showInterestedForm });
      return;
    }
    this.setState({ showInterestedForm: false });
    await this.api.interested({
      userid: user.id,
      eventid: event.id
    });
  }

  async rsvp(response) {
    this.setState({ view: 'ticketConfirmed' });
    await this.api.rsvp(response);
  }

  changeView(view) {
    this.setState({view});
    window.scrollTo(0,0);
  }

  updateResponse(response) {
    this.setState({ response });
  }

  resetResponse() {
    this.setState({ response: {} });
    this.changeView('event');
  }

  handleGetTicketClick(response) {
    const actions = this.state.actions;
    actions[1] = {
      label: 'Get another ticket',
      onClick: this.resetResponse
    };
    this.setState({ response, actions });
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
          <SignInUp label="I'm interested" emailOnly={true} onClick={(user) => this.setInterested(user, event)} />
        }

        {this.state.view == 'GetTicket' && 
          <GetTicketForm
            onCancel={this.resetResponse}
            onClick={this.rsvp}
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
                  <Tier tier={tier}
                    onChange={(response) => this.updateResponse(response)}
                    onClick={(response) => this.handleGetTicketClick(response)}
                    />
                )}
              </div>
            </div>

            <div className={styles.map}>
              <Map lat={Event.lat} lng={Event.lng} className={styles.map} />
            </div>
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

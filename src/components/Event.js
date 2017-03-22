import React from 'react'
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import EventHeader from '../components/EventHeader';
import ActionBar from '../components/ActionBar';
import NotFound from '../components/NotFound';
import Location from '../components/Location';
import HashLink from 'react-scrollchor';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import GetTicketForm from '../components/GetTicketForm';
import InterestedForm from '../components/InterestedForm';
import Responses from '../components/Responses';
import { filterCollection } from '../lib/utils';
import { addEventData } from '../graphql/queries';
import { addCreateResponseMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import TicketsConfirmed from '../components/TicketsConfirmed';
import Loading from '../components/Loading';
import Error from '../components/Error';
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
    this.event = this.props.data.Event; // pre-loaded by SSR
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
    const { Event, error, loading } = this.props.data;

    if (loading) return (<Loading />);

    this.event = Event;

    if ( error ) {
      console.error(error.message);
      return (<Error message="GraphQL error" />)
    }

    if (!loading && !this.props.data.Event) {
      return (<NotFound />)
    }

    const going = loading && filterCollection(Event.responses, {'status':'YES'});
    const interested = loading && filterCollection(Event.responses, {'status':'INTERESTED'});

    const info = (
      <HashLink to="#location">
        <FormattedDate value={Event.startsAt} weekday='short' day='numeric' month='long' />, &nbsp;
        <FormattedTime value={Event.startsAt} timeZone={Event.timezone} />&nbsp; - &nbsp;
        {Event.location}
      </HashLink>
    );

    return (
      <div>
        <Header
          title={this.event.name}
          className={this.state.status} 
          />

        <Body>
          <TicketsConfirmed
            show={this.state.modal === 'TicketsConfirmed'}
            onClose={this.closeModal}
            event={this.event}
            response={this.state.response} />

          <div className={`EventPage ${this.state.modal && 'showModal'}`}>

            <NotificationBar status={this.state.status} error={this.state.error} />

            {this.state.view === 'loading' && <Loading /> }

            {this.state.view === 'default' &&
              <EventHeader
                logo={Event.collective.logo}
                title={Event.name}
                backgroundImage={Event.backgroundImage || Event.collective.backgroundImage || defaultBackgroundImage}
                />
            }

            {this.state.view !== 'loading' &&
              <ActionBar
                actions={this.state.actions}
                info={info}
                />
            }

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

                <Location
                  location={Event.location}
                  address={Event.address}
                  lat={Event.lat}
                  long={Event.long}
                  />

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
        </Body>
        <Footer />
      </div>
    )
  }
}

const EventWithDataWithMutation = addCreateResponseMutation(addEventData(Event));

export default EventWithDataWithMutation;

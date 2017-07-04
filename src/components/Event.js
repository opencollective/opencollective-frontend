import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ActionBar from '../components/ActionBar';
import Location from '../components/Location';
import HashLink from 'react-scrollchor';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import GetTicketForm from '../components/GetTicketForm';
import InterestedForm from '../components/InterestedForm';
import Sponsors from '../components/Sponsors';
import Responses from '../components/Responses';
import { filterCollection } from '../lib/utils';
import { addCreateResponseMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import TicketsConfirmed from '../components/TicketsConfirmed';
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';
import { uniq } from 'underscore';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Event extends React.Component {

  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.event = this.props.event; // pre-loaded by SSR
    this.setInterested = this.setInterested.bind(this);
    this.updateResponse = this.updateResponse.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleGetTicketClick = this.handleGetTicketClick.bind(this);
    this.rsvp = this.rsvp.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.defaultActions = [
      {
        component: (<FormattedMessage id='actions.interested' defaultMessage='interested' />),
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

    // To test confirmation screen, uncomment the following:
    // this.state.modal = "TicketsConfirmed";
    // this.state.response = {
    //   user: { email: "etienne@gmail.com"},
    //   tier: this.event && this.event.tiers[0],
    //   quantity: 2
    // };

  }

  componentDidMount() {
    window.oc = { event: this.event }; // for easy debugging
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

  getDefaultActions(props) {
    const { LoggedInUser } = props || this.props;
    const editUrl = `/${this.event.collective.slug}/events/${this.event.slug}/edit`;
    if (LoggedInUser && LoggedInUser.canEditEvent) {
      return [...this.defaultActions, {
        className: 'whiteblue small',
        component: <a href={editUrl}>EDIT</a>
      }]
    } else {
      return this.defaultActions;
    }
  }

  componentWillReceiveProps(props) {
    if (props) {
      this.setState({actions: this.getDefaultActions(props) });
    }
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
        actions = this.getDefaultActions();
        break;
    }
    this.setState({view, actions});
    window.scrollTo(0,0);
  }

  async createResponse(response) {
    response.tier = response.tier || {};
    const ResponseInputType = {
      collective: { slug: this.event.collective.slug },
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

  render() {
    const responses = {};
    responses.sponsors = filterCollection(this.event.responses, { tier: { name: /sponsor/i }});
    responses.guests = filterCollection(uniq(this.event.responses, (r) => `${r.status}:${r.user.username}` ), { tier: { name: /sponsor/i }}, true);
    responses.going = filterCollection(responses.guests, {'status':'YES'});
    responses.interested = filterCollection(responses.guests, {'status':'INTERESTED'});

    const info = (
      <HashLink to="#location">
        <FormattedDate value={this.event.startsAt} weekday='short' day='numeric' month='long' />, &nbsp;
        <FormattedTime value={this.event.startsAt} timeZone={this.event.timezone} />&nbsp; - &nbsp;
        {this.event.location.name}
      </HashLink>
    );

    const backgroundImage = this.event.backgroundImage || this.event.collective.backgroundImage || defaultBackgroundImage;

    return (
      <div>

        <TicketsConfirmed
          show={this.state.modal === 'TicketsConfirmed'}
          onClose={this.closeModal}
          event={this.event}
          response={this.state.response} />

        <div className="EventPage">

          <Header
            title={this.event.name}
            description={this.event.description}
            twitterHandle={this.event.collective.twitterHandle}
            image={this.event.collective.logo || backgroundImage}
            className={this.state.status}
            LoggedInUser={this.props.LoggedInUser}
            scripts={['stripe']}
            />

          <Body>

            <div className={`EventPage ${this.state.modal && 'showModal'}`}>

              <NotificationBar status={this.state.status} error={this.state.error} />

              {this.state.view === 'default' &&
                <CollectiveCover
                  collective={this.event.collective}
                  logo={this.event.collective.logo}
                  title={this.event.name}
                  backgroundImage={backgroundImage}
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
                  tier={this.state.response.tier || this.event.tiers[0]}
                  />
              }

              {this.state.view == 'default' &&
                <div>
                  <div className="content" >
                    <div className="eventDescription" >
                      <Markdown source={this.event.description} />
                    </div>

                    <div id="tickets">
                      {this.event.tiers.map((tier) =>
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

                  <Location location={this.event.location} />

                  { responses.guests.length >= 10 &&
                    <section id="responses">
                      <h1>
                        <FormattedMessage id='event.responses.title.going' values={{n: responses.going.length}} defaultMessage={`{n} {n, plural, one {person going} other {people going}}`} />
                        { responses.interested.length > 0 &&
                          <span>
                            <span> - </span>
                            <FormattedMessage id='event.responses.title.interested' values={{n: responses.interested.length}} defaultMessage={`{n} interested`} />
                          </span>
                        }
                      </h1>
                      <Responses responses={responses.guests} />
                    </section>
                  }
                  { responses.sponsors.length > 0 &&
                    <section id="sponsors">
                      <h1>
                        <FormattedMessage id='event.sponsors.title' defaultMessage={`Sponsors`} />
                      </h1>
                      <Sponsors sponsors={responses.sponsors.map(r => {
                        const user = Object.assign({}, r.user);
                        user.tier = r.tier;
                        user.createdAt = new Date(r.createdAt);
                        return user;
                      })} />
                    </section>
                  }

                </div>
              }
            </div>
          </Body>
          <Footer />
          </div>
      </div>
    )
  }
}

export default addCreateResponseMutation(Event);

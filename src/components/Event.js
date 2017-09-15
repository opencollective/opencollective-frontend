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
import OrderForm from '../components/OrderForm';
import InterestedForm from '../components/InterestedForm';
import Sponsors from '../components/Sponsors';
import Responses from '../components/Responses';
import { filterCollection } from '../lib/utils';
import Markdown from 'react-markdown';
import TicketsConfirmed from '../components/TicketsConfirmed';
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';
import { uniqBy, get, union } from 'lodash';
import { capitalize } from '../lib/utils';
import { Router } from '../server/pages';
import { addEventMutations } from '../graphql/mutations';
import { exportMembers } from '../lib/export_file';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Event extends React.Component {

  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.setInterested = this.setInterested.bind(this);
    this.removeInterested = this.removeInterested.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleOrderTier = this.handleOrderTier.bind(this);
    this.createOrder = this.createOrder.bind(this);
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
      order: {},
      api: { status: 'idle' },
      event: this.props.event,
      // actions: this.defaultActions
      actions: this.getDefaultActions(this.props)
    };

    // To test confirmation screen, uncomment the following:
    // this.state.view = "GetTicket";
    // this.state.order = {
    //   user: { email: "etienne@gmail.com"},
    //   tier: this.state.event && this.state.event.tiers[1],
    //   quantity: 2
    // };

  }

  componentDidMount() {
    window.oc = { event: this.state.event }; // for easy debugging
  }

  async removeInterested() {
    const res = await this.props.removeMember({ id: this.props.LoggedInUser.CollectiveId }, { id: this.state.event.id }, 'FOLLOWER');
    const memberRemoved = res.data.removeMember;
    const event = { ... this.state.event };
    event.members = event.members.filter(member => member.id !== memberRemoved.id);
    const actions = this.state.actions;
    actions[0].className = '';
    actions[0].icon = '';
    actions[0].onClick = this.setInterested;
    this.setState({ showInterestedForm: false, event, actions });
  }

  /**
   * If user is logged in, we directly create a response 
   * Otherwise, we show the form to enter an email address
   */
  async setInterested(member) {
    member = member || this.props.LoggedInUser && { id: this.props.LoggedInUser.CollectiveId };
    if (member) {
      const parts = member.email && member.email.substr(0, member.email.indexOf('@')).split('.');
      if (parts && parts.length > 1) {
        member.firstName = capitalize(parts[0] || '');
        member.lastName = capitalize(parts[1] || '');
      }
      try {
        const res = await this.props.createMember(member, { id: this.state.event.id }, 'FOLLOWER');
        const event = { ... this.state.event };
        event.members = [ ...event.members, res.data.createMember ];
        this.setState({ showInterestedForm: false, event });
        const actions = this.state.actions;
        actions[0].className = 'selected';
        actions[0].icon = 'star';
        actions[0].onClick = this.removeInterested;
        this.setState({ actions, showInterestedForm: false });
      } catch (e) {
        console.error(e);
        let message = '';
        if (e && e.graphQLErrors) {
          message = ` (error: ${e.graphQLErrors[0].message})`;
        }
        this.error(`An error occured 😳. We couldn't register you as interested. Please try again in a few.${message}`);
      }
      return;
    } else {
      this.setState({ showInterestedForm: !this.state.showInterestedForm });
      return;
    }
  }

  async createOrder(order) {
    order.tier = order.tier || {};
    const OrderInputType = {
      ... order,
      collective: { slug: this.collective.slug },
      tier: { id: order.tier.id }
    };

    this.setState( { status: 'loading' });
    try {
      await this.props.createOrder(OrderInputType);
      this.setState({ status: 'idle', order, view: 'default', modal: 'TicketsConfirmed' });
    } catch (err) {
      console.error(">>> createOrder error: ", err);
      throw new Error(err.graphQLErrors[0].message);
    }
  }

  closeModal() {
    this.setState({ modal: null });
  }

  getDefaultActions(props) {
    const { LoggedInUser } = props || this.props;
    const editUrl = `/${this.state.event.slug}/edit`;
    if (LoggedInUser) {
      const actions = [ ...this.defaultActions ];
      if (LoggedInUser.canEditEvent) {
        actions.push({
          className: 'whiteblue small',
          component: <a href={editUrl}>EDIT</a>
        });
      }
      if (this.state.event.members.find( member => member.member.id === LoggedInUser.CollectiveId && member.role === 'FOLLOWER')) {
        actions[0].className = 'selected';
        actions[0].icon = 'star';
        actions[0].onClick = this.removeInterested;
      }
      return actions;
    } else {
      return this.defaultActions;
    }
  }

  componentWillReceiveProps(props) {
    if (props) {
      this.setState({ actions: this.getDefaultActions(props) });
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
      collective: { slug: this.state.event.slug },
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

  resetResponse() {
    this.setState({ response: {} });
    this.changeView('default');
  }

  updateOrder(tier) {
    const order = {
      tier: { id: tier.id },
      quantity: tier.quantity,
      totalAmount: (tier.quantity || 1) * tier.amount,
      interval: tier.interval
    }
    this.setState({ order });
    // if (typeof window !== undefined) {
    //   window.state = this.state;
    // }
  }

  handleOrderTier(tier) {
    console.log(">>> handleOrderTier", tier);
    this.updateOrder(tier);

    const { event, order } = this.state;
    order.tier = { id: tier.id };
    
    // If the total amount is 0 and the user is logged in, we can directly RSVP.
    if (order.totalAmount === 0 && this.props.LoggedInUser) {
      order.user = { id: this.props.LoggedInUser.id };
      return this.createOrder(order);
    }
    this.setState({ order, showInterestedForm: false });
    let route = `/${event.slug}/order/${order.tier.id}`;
    if (order.totalAmount) {
      route += `/${order.totalAmount / 100}`;
    }
    if (order.interval) {
      route += `/${order.interval}`;
    }
    Router.pushRoute(route);
  }

  render() {
    const { event } = this.state;
    const { LoggedInUser } = this.props;
    const responses = {};
    responses.sponsors = filterCollection(event.orders, { tier: { name: /sponsor/i }});

    const guests = {};
    guests.interested = [];
    filterCollection(event.members, { role: 'FOLLOWER' }).map(follower => {
      guests.interested.push({
        user: follower.member,
        status: 'INTERESTED'
      });
    });
    guests.confirmed = [];
    event.orders.map(order => {
      guests.confirmed.push({
        user: order.fromCollective,
        createdAt: order.createdAt,
        status: 'YES'
      })
    });

    const allGuests = union(guests.interested, guests.confirmed).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    responses.guests = uniqBy(allGuests, (r) => r.user.id);
    responses.going = filterCollection(responses.guests, { status: 'YES' });
    responses.interested = filterCollection(responses.guests, { status: 'INTERESTED' });

    const info = (
      <HashLink to="#location">
        <FormattedDate value={event.startsAt} weekday='short' day='numeric' month='long' />, &nbsp;
        <FormattedTime value={event.startsAt} timeZone={event.timezone} />&nbsp; - &nbsp;
        {event.location.name}
      </HashLink>
    );

    const backgroundImage = event.backgroundImage || event.parentCollective.backgroundImage || defaultBackgroundImage;

    console.log("event", event);

    return (
      <div>
        <style jsx>{`
          .adminActions {
            text-align: center;
            text-transform: uppercase;
            font-size: 1.3rem;
            font-weight: 600;
            letter-spacing: 0.05rem;
          }
          .adminActions ul {
            overflow: hidden;
            text-align: center;
            margin: 0 auto;
            padding: 0;
            display: flex;
            justify-content: center;
            flex-direction: row;
            list-style: none;
          }
          .adminActions ul li {
            margin: 0 2rem;
          }
          #tickets :global(.tier) {
            margin: 4rem auto;            
          }
        `}</style>
        <TicketsConfirmed
          show={this.state.modal === 'TicketsConfirmed'}
          onClose={this.closeModal}
          event={event}
          response={this.state.order} />

        <div className="EventPage">

          <Header
            title={event.name}
            description={event.description || event.longDescription}
            twitterHandle={event.parentCollective.twitterHandle}
            image={event.parentCollective.image || backgroundImage}
            className={this.state.status}
            LoggedInUser={LoggedInUser}
            />

          <Body>

            <div className={`EventPage ${this.state.modal && 'showModal'}`}>

              <NotificationBar status={this.state.status} error={this.state.error} />

              {this.state.view === 'default' &&
                <CollectiveCover
                  collective={event}
                  style={get(event, 'settings.style.hero.cover') || get(event.parentCollective, 'settings.style.hero.cover')}                  
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
                <div className="content" >              
                  <OrderForm
                    onSubmit={this.createOrder}
                    quantity={this.state.order.quantity}
                    tier={this.state.order.tier || event.tiers[0]}
                    LoggedInUser={LoggedInUser}
                    />
                </div>
              }

              {this.state.view == 'default' &&
                <div>
                  <div className="content" >
                    <div className="eventDescription" >
                      <Markdown source={event.description || event.longDescription} />
                    </div>

                    <div id="tickets">
                      {event.tiers.map((tier) =>
                        <Tier
                          key={tier.id}
                          className="tier"
                          tier={tier}
                          onChange={(response) => this.updateOrder(response)}
                          onClick={(response) => this.handleOrderTier(response)}
                          />
                      )}
                    </div>
                  </div>

                  <Location location={event.location} />

                  { responses.guests.length > 0 &&
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
                      { LoggedInUser.canEditEvent &&
                      <div className="adminActions" id="adminActions">
                        <ul>
                          <li><a href={`/${this.event.collective.slug}/events/${this.event.slug}/nametags.pdf`}>Print name tags</a></li>
                          <li><a href={`mailto:${this.event.slug}@${this.event.collective.slug}.opencollective.com`}>Send email</a></li>
                          <li><a onClick={ () => exportMembers(this.event) }>Export CSV</a></li>
                        </ul>
                      </div>
                      }
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

export default addEventMutations(Event);

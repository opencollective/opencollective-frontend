import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import Location from './Location';
import Tier from './Tier';
import NotificationBar from './NotificationBar';
import InterestedForm from './InterestedForm';
import Sponsors from './Sponsors';
import Responses from './Responses';
import { capitalize, filterCollection, trimObject } from '../lib/utils';
import Markdown from 'react-markdown';
import { defineMessages, FormattedMessage } from 'react-intl';
import { uniqBy, get, union } from 'lodash';
import { Router } from '../server/pages';
import { addEventMutations } from '../graphql/mutations';
import { exportRSVPs } from '../lib/export_file';
import ExpensesSection from '../apps/expenses/components/ExpensesSection';
import withIntl from '../lib/withIntl';
import Button from './Button';
import SectionTitle from './SectionTitle';
import SendMoneyToCollectiveBtn from './SendMoneyToCollectiveBtn';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Event extends React.Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
  };

  static getDerivedStateFromProps(props) {
    return { event: props.event };
  }

  constructor(props) {
    super(props);

    this.setInterested = this.setInterested.bind(this);
    this.removeInterested = this.removeInterested.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleOrderTier = this.handleOrderTier.bind(this);

    this.state = {
      showInterestedForm: false,
      order: { tier: {} },
      tierInfo: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'event.over.sendMoneyToParent.title': {
        id: 'event.over.sendMoneyToParent.title',
        defaultMessage: 'Event is over and still has a positive balance',
      },
      'event.over.sendMoneyToParent.description': {
        id: 'event.over.sendMoneyToParent.description',
        defaultMessage:
          'If you still have expenses related to this event, please file them. Otherwise consider moving the money to your collective {collective}',
      },
      'event.over.sendMoneyToParent.transaction.description': {
        id: 'event.over.sendMoneyToParent.transaction.description',
        defaultMessage: 'Balance of {event}',
      },
      'event.tickets.edit': {
        id: 'event.tickets.edit',
        defaultMessage: 'Edit tickets',
      },
    });
  }

  async removeInterested() {
    const { LoggedInUser } = this.props;
    const memberCollectiveId = this.state.interestedUserCollectiveId || (LoggedInUser && LoggedInUser.CollectiveId);
    const res = await this.props.removeMember({ id: memberCollectiveId }, { id: this.state.event.id }, 'FOLLOWER');
    const memberRemoved = res.data.removeMember;
    const event = { ...this.state.event };
    event.members = event.members.filter(member => member.id !== memberRemoved.id);
    this.setState({ showInterestedForm: false, event });
  }

  /**
   * If user is logged in, we directly create a response
   * Otherwise, we show the form to enter an email address
   */
  async setInterested(member) {
    member = member || (this.props.LoggedInUser && { id: this.props.LoggedInUser.CollectiveId });
    if (member) {
      const parts = member.email && member.email.substr(0, member.email.indexOf('@')).split('.');
      if (parts && parts.length > 1) {
        member.firstName = capitalize(parts[0] || '');
        member.lastName = capitalize(parts[1] || '');
      }
      try {
        const res = await this.props.createMember(member, { id: this.state.event.id }, 'FOLLOWER');
        const memberCreated = res.data.createMember;
        const interestedUserCollectiveId = memberCreated.member.id;
        const event = { ...this.state.event };
        event.members = [...event.members, memberCreated];
        this.setState({
          showInterestedForm: false,
          event,
          interestedUserCollectiveId,
        });
        this.setState({ showInterestedForm: false });
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

  error(msg) {
    this.setState({ status: 'error', error: msg });
    setTimeout(() => {
      this.setState({ status: 'idle', error: null });
    }, 5000);
  }

  resetResponse() {
    this.setState({ response: {} });
  }

  updateOrder(tier) {
    const tierInfo = Object.assign({}, { ...this.state.tierInfo });
    const singleAmount = tier.singleAmount || tier.amount;
    const order = {
      tier: { id: tier.id },
      quantity: tier.quantity,
      totalAmount: (tier.quantity || 1) * singleAmount,
      interval: tier.interval,
    };
    tierInfo[tier.id] = tier;
    this.setState({ order, tierInfo });
    return order;
  }

  handleOrderTier(tier) {
    const order = this.updateOrder(tier);
    const { event } = this.state;

    this.setState({ order, showInterestedForm: false });
    const params = trimObject({
      eventSlug: event.slug,
      collectiveSlug: event.parentCollective.slug,
      tierId: order.tier.id,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      interval: order.interval,
      verb: 'events',
    });
    Router.pushRoute('orderEventTier', params).then(() => {
      window.location.hash = '#content';
    });
  }

  render() {
    const { LoggedInUser, intl } = this.props;
    const { event } = this.state;

    const canEditEvent = LoggedInUser && LoggedInUser.canEditEvent(event);
    const responses = { sponsors: [] };

    const isEventOver = new Date(event.endsAt).getTime() < new Date().getTime();

    const guests = {};
    guests.interested = [];
    filterCollection(event.members, { role: 'FOLLOWER' }).map(follower => {
      if (!follower.member) {
        console.error('>>> no user collective for membership', follower);
        return;
      }
      guests.interested.push({
        user: follower.member,
        status: 'INTERESTED',
      });
    });
    guests.confirmed = [];
    event.orders.map(order => {
      if (!order.fromCollective) {
        console.error('>>> no user collective for order', order);
        return;
      }
      if (get(order, 'tier.name', '').match(/sponsor/i)) {
        responses.sponsors.push(order);
      } else {
        guests.confirmed.push({
          user: order.fromCollective,
          createdAt: order.createdAt,
          status: 'YES',
        });
      }
    });

    const allGuests = union(guests.interested, guests.confirmed).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    responses.guests = uniqBy(allGuests, r => r.user && r.user.id);
    responses.going = filterCollection(responses.guests, { status: 'YES' });
    responses.interested = filterCollection(responses.guests, {
      status: 'INTERESTED',
    });

    let notification = {};
    // If event is over and has a positive balance, we ask the admins if they want to move the money to the parent collective
    if (isEventOver && get(this.props.event, 'stats.balance') > 0 && canEditEvent) {
      notification = {
        title: intl.formatMessage(this.messages['event.over.sendMoneyToParent.title']),
        description: intl.formatMessage(this.messages['event.over.sendMoneyToParent.description'], {
          collective: event.parentCollective.name,
        }),
        actions: [
          <Button key="submitExpenseBtn" className="submitExpense gray" href={`${event.path}/expenses/new`}>
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </Button>,
          <SendMoneyToCollectiveBtn
            key="SendMoneyToCollectiveBtn"
            fromCollective={event}
            toCollective={event.parentCollective}
            LoggedInUser={LoggedInUser}
            description={intl.formatMessage(this.messages['event.over.sendMoneyToParent.transaction.description'], {
              event: event.name,
            })}
            amount={event.stats.balance}
            currency={event.currency}
          />,
        ],
      };
    }

    const backgroundImage =
      event.backgroundImage || get(event, 'parentCollective.backgroundImage') || defaultBackgroundImage;

    return (
      <div>
        <style jsx>
          {`
            .EventPage .content {
              max-width: 96rem;
            }
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
            .ticketsGrid :global(.tier) {
              margin: 2rem auto;
            }
          `}
        </style>

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
              <NotificationBar
                status={this.state.status}
                title={notification.title}
                description={notification.description}
                actions={notification.actions}
                error={this.state.error}
              />

              <CollectiveCover
                collective={event}
                title={event.name}
                LoggedInUser={LoggedInUser}
                cta={{ label: 'tickets', href: '#tickets' }}
                style={
                  get(event, 'settings.style.hero.cover') || get(event.parentCollective, 'settings.style.hero.cover')
                }
              />

              {this.state.showInterestedForm && <InterestedForm onSubmit={this.setInterested} />}

              <div>
                <div className="content">
                  <div className="eventDescription">
                    <Markdown source={event.longDescription || event.description} escapeHtml={false} />
                  </div>

                  <section id="tickets">
                    <SectionTitle
                      section="tickets"
                      action={
                        LoggedInUser && LoggedInUser.canEditCollective(event)
                          ? {
                              label: intl.formatMessage(this.messages['event.tickets.edit']),
                              href: `${event.path}/edit#tiers`,
                            }
                          : null
                      }
                    />

                    <div className="ticketsGrid">
                      {event.tiers.map(tier => (
                        <Tier
                          key={tier.id}
                          tier={tier}
                          values={this.state.tierInfo[tier.id] || {}}
                          onChange={response => this.updateOrder(response)}
                          onClick={response => this.handleOrderTier(response)}
                        />
                      ))}
                    </div>
                  </section>
                </div>

                {get(event, 'location.name') && <Location location={event.location} />}

                {responses.sponsors.length > 0 && (
                  <section id="sponsors">
                    <h1>
                      <FormattedMessage id="event.sponsors.title" defaultMessage="Sponsors" />
                    </h1>
                    <Sponsors
                      sponsors={responses.sponsors.map(r => {
                        const sponsorCollective = Object.assign({}, r.fromCollective);
                        sponsorCollective.tier = r.tier;
                        sponsorCollective.createdAt = new Date(r.createdAt);
                        return sponsorCollective;
                      })}
                    />
                  </section>
                )}

                {responses.guests.length > 0 && (
                  <section id="responses">
                    <h1>
                      <FormattedMessage
                        id="event.responses.title.going"
                        values={{ n: responses.going.length }}
                        defaultMessage="{n} {n, plural, one {person going} other {people going}}"
                      />
                      {responses.interested.length > 0 && (
                        <span>
                          <span> - </span>
                          <FormattedMessage
                            id="event.responses.title.interested"
                            values={{ n: responses.interested.length }}
                            defaultMessage="{n} interested"
                          />
                        </span>
                      )}
                    </h1>
                    {canEditEvent && (
                      <div className="adminActions" id="adminActions">
                        <ul>
                          <li>
                            <a href={`/${event.parentCollective.slug}/events/${event.slug}/nametags.pdf`}>
                              Print name tags
                            </a>
                          </li>
                          <li>
                            <a href={`mailto:${event.slug}@${event.parentCollective.slug}.opencollective.com`}>
                              Send email
                            </a>
                          </li>
                          <li>
                            <a onClick={() => exportRSVPs(event)}>Export CSV</a>
                          </li>
                        </ul>
                      </div>
                    )}
                    <Responses responses={responses.guests} />
                  </section>
                )}

                <ExpensesSection collective={event} LoggedInUser={LoggedInUser} limit={10} />
              </div>
            </div>
          </Body>
          <Footer />
        </div>
      </div>
    );
  }
}

export default withIntl(addEventMutations(Event));

import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { uniqBy, get, union } from 'lodash';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import Location from './Location';
import Tier from './Tier';
import NotificationBar from './NotificationBar';
import Sponsors from './Sponsors';
import Responses from './Responses';
import { filterCollection, trimObject } from '../lib/utils';
import { canOrderTicketsFromEvent, moneyCanMoveFromEvent } from '../lib/events';
import { Router } from '../server/pages';
import { exportRSVPs } from '../lib/export_file';
import ExpensesSection from './expenses/ExpensesSection';
import Button from './Button';
import SectionTitle from './SectionTitle';
import SendMoneyToCollectiveBtn from './SendMoneyToCollectiveBtn';

class Event extends React.Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    /** Should be set to true if event is (re-)fetching. Disables actions. */
    isLoading: PropTypes.bool,
  };

  static getDerivedStateFromProps(props) {
    return { event: props.event };
  }

  constructor(props) {
    super(props);

    this.updateOrder = this.updateOrder.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.handleOrderTier = this.handleOrderTier.bind(this);

    this.state = {
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
    const order = {
      tier: { id: tier.id },
      quantity: tier.quantity,
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
      verb: 'events',
    });
    Router.pushRoute('orderEventTier', params).then(() => {
      window.location.hash = '#content';
    });
  }

  render() {
    const { LoggedInUser, intl, isLoading } = this.props;
    const { event } = this.state;

    const canEditEvent = LoggedInUser && LoggedInUser.canEditEvent(event);
    const responses = { sponsors: [] };
    const canOrderTickets = canOrderTicketsFromEvent(event);

    const guests = {};
    guests.interested = [];
    filterCollection(event.members, { role: 'FOLLOWER' }).map(follower => {
      if (!follower.member) {
        // console.error('>>> no user collective for membership', follower);
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
        // console.error('>>> no user collective for order', order);
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
    if (canEditEvent && moneyCanMoveFromEvent(event)) {
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
            .hide {
              display: none;
            }
          `}
        </style>

        <div className="EventPage">
          <Header collective={event} className={this.state.status} LoggedInUser={LoggedInUser} />

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
                cta={canOrderTickets ? { label: 'tickets', href: '#tickets' } : null}
                forceLegacy
              />

              <div>
                <div className="content">
                  <div className="eventDescription">
                    <Markdown source={event.longDescription || event.description} escapeHtml={false} />
                  </div>
                  {!canOrderTickets ? null : (
                    <section id="tickets">
                      <SectionTitle
                        section="tickets"
                        action={
                          canEditEvent
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
                  )}
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
                    {!isLoading && canEditEvent && (
                      <div className="adminActions" id="adminActions">
                        <ul>
                          <li>
                            <a href={`mailto:${event.slug}@${event.parentCollective.slug}.opencollective.com`}>
                              <FormattedMessage id="Event.SendEmail" defaultMessage="Send email" />
                            </a>
                          </li>
                          <li>
                            <a onClick={() => exportRSVPs(event)}>
                              <FormattedMessage
                                id="Export.Format"
                                defaultMessage="Export {format}"
                                values={{ format: 'CSV' }}
                              />
                            </a>
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

export default injectIntl(Event);

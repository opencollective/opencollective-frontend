import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import OrderForm from '../components/OrderForm';
import NotificationBar from '../components/NotificationBar';
import MembersWithData from '../components/MembersWithData';
import { addCreateOrderMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import { get } from 'lodash';
import { Router } from '../server/pages';
import MenuBar from './MenuBar';
import CollectiveCard from './CollectiveCard';
import HashLink from 'react-scrollchor';
import { FormattedMessage, defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import ExpensesWithData from './ExpensesWithData';
import TransactionsWithData from './TransactionsWithData';
import { Button } from 'react-bootstrap';
import { Link } from '../server/pages';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Collective extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.collective = this.props.collective; // pre-loaded by SSR
    this.updateOrder = this.updateOrder.bind(this);
    this.resetOrder = this.resetOrder.bind(this);
    this.handleOrderTier = this.handleOrderTier.bind(this);

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({      
      'collective.since': { id: 'usercollective.since', defaultMessage: `Established in {year}`},
      'collective.members.admin.title': { id: 'collective.members.admin.title', defaultMessage: `{n} {n, plural, one {core contributor} other {core contributors}}`},
      'collective.members.member.title': { id: 'collective.members.member.title', defaultMessage: `{n} {n, plural, one {member} other {members}}`},
      'collective.members.backer.title': { id: 'collective.members.backer.title', defaultMessage: `{n} {n, plural, one {backer} other {backers}}`},
      'collective.members.follower.title': { id: 'collective.members.follower.title', defaultMessage: `{n} {n, plural, one {follower} other {followers}}`},
      'collective.menu.host': { id: 'collective.menu.host', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.admin': { id: 'collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.member': { id: 'collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.backer': { id: 'collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.follower': { id: 'collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    })
    
  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
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
      this.setState( { status: 'idle' });
    } catch (err) {
      console.error(">>> createOrder error: ", err);
      throw new Error(err.graphQLErrors[0].message);
    }
  }

  error(msg) {
    this.setState( {status: 'error', error: msg });
    setTimeout(() => {
      this.setState( { status: 'idle', error: null });
    }, 5000);
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

  resetOrder() {
    this.setState({ order: {} });
  }

  handleOrderTier(tier) {
    this.updateOrder(tier);
    const order = this.state.order;
    order.tier = { id: tier.id };

    // If the total amount is 0 and the user is logged in, we can directly RSVP.
    if (order.totalAmount === 0 && this.props.LoggedInUser) {
      order.user = { id: this.props.LoggedInUser.id };
      return this.createOrder(order);
    }
    this.setState({ order });
    let route = `/${this.props.collective.slug}/order/${order.tier.id}`;
    if (order.totalAmount) {
      route += `/${order.totalAmount / 100}`;
    }
    if (order.interval) {
      route += `/${order.interval}`;
    }
    Router.pushRoute(route);
  }

  render() {
    console.log("CollectivePage> this.collective", this.collective, "state", this.state);
    const { intl, LoggedInUser } = this.props;

    const tiers = [...this.collective.tiers].sort((a, b) => {
      return (a.amount < b.amount) ? 1 : -1;
    })

    const actions = [
      {
        className: 'whiteblue',
        component: <HashLink to={`#backers`}>
            <FormattedMessage
              id="collective.backers"
              defaultMessage={`{n} {n, plural, one {backer} other {backers}}`}
              values={{ n: this.collective.stats.backers}}
              />
          </HashLink>        
      },
      {
        className: 'whiteblue',
        component: <HashLink to={`#sponsors`}>
            <FormattedMessage
              id="collective.sponsors"
              defaultMessage={`{n} {n, plural, one {sponsor} other {sponsors}}`}
              values={{ n: this.collective.stats.sponsors}}
              />
          </HashLink>
      },
      {
        className: 'whiteblue',
        component: <Link route={`/${this.collective.slug}/contribute`}><a>
            <FormattedMessage
              id="collective.contribute"
              defaultMessage={`contribute`}
              /></a>
          </Link>
      }
    ];

    if (LoggedInUser && LoggedInUser.canEditCollective) {
      actions.push({
        className: 'whiteblue small',
        component: <a href={`/${this.collective.slug}/edit`}>EDIT COLLECTIVE</a>
      });
    }

    const backgroundImage = this.collective.backgroundImage || get(this.collective,'parentCollective.backgroundImage') || defaultBackgroundImage;

    return (
      <div className="CollectivePage">
        <style jsx>{`
          .tier {
            text-align: center;
            font-size: 1.4rem;
          }
        `}</style>

        <Header
          title={this.collective.name}
          description={this.collective.description || this.collective.longDescription}
          twitterHandle={this.collective.twitterHandle || get(this.collective.parentCollective, 'twitterHandle')}
          image={get(this.collective.parentCollective, 'image') || backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          href={`/${this.collective.slug}`}
          />

        <Body>

          <div className="CollectivePage">

            <NotificationBar status={this.state.status} error={this.state.error} />

            <CollectiveCover
              collective={this.collective}
              style={get(this.collective, 'settings.style.hero.cover') || get(this.collective.parentCollective, 'settings.style.hero.cover')}                  
              />

            <MenuBar
              info={intl.formatMessage(this.messages['collective.since'], { year: (new Date(this.collective.createdAt)).getFullYear() })}
              actions={actions}
              />

            <div>

              { this.state.view === 'OrderTier' &&
                <div className="content" >              
                  <OrderForm
                    onSubmit={this.createOrder}
                    order={this.state.order}
                    LoggedInUser={this.props.LoggedInUser}
                    />
                </div>
              }

              <div className="content" >
                <div className="longDescription" >
                  <Markdown source={this.collective.longDescription || this.collective.description} />
                </div>
              </div>

              { tiers.map(tier => (
                <section id={tier.slug} className="tier">
                  <div className="content" >
                    <h1>{tier.name}</h1>
                    <p>{tier.description}</p>
                    <Button bsStyle="primary" onClick={() => this.handleOrderTier(tier)}>{tier.button}</Button>
                    <MembersWithData
                      collective={this.collective}
                      tier={tier}
                      limit={100}
                      />
                  </div>
                </section>
              ))}

              { this.collective.memberOf.length > 0 &&
                <section id="hosting">
                  <h1>
                    <FormattedMessage
                      id="collective"
                      values={{ n: this.collective.memberOf.length }}
                      defaultMessage={`{n, plural, one {collective} other {collectives}}`}
                      />
                  </h1>
                  {this.collective.memberOf.map((membership) =>
                    <CollectiveCard
                      key={membership.id}
                      className="membership"
                      collective={membership.collective}
                      membership={membership}
                      />
                  )}

                </section>
              }

              <section id="expenses">
                <h1>
                  <FormattedMessage
                    id="collective.expenses.title"
                    values={{ n: this.collective.stats.expenses }}
                    defaultMessage={`{n, plural, one {Latest transaction} other {Latest expenses}}`}
                    />
                </h1>
                <ExpensesWithData
                  collective={this.collective}
                  LoggedInUser={LoggedInUser}
                  limit={5}
                  />
              </section>

              <section id="transactions">
                <h1>
                  <FormattedMessage
                    id="collective.transactions.title"
                    values={{ n: this.collective.stats.transactions }}
                    defaultMessage={`{n, plural, one {Latest transaction} other {Latest transactions}}`}
                    />
                </h1>
                <TransactionsWithData
                  collective={this.collective}
                  LoggedInUser={LoggedInUser}
                  limit={5}
                  />
              </section>


            </div>
          </div>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default addCreateOrderMutation(withIntl(Collective));

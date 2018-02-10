import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import TierCard from '../components/TierCard';
import NotificationBar from '../components/NotificationBar';
import MembersWithData from '../components/MembersWithData';
import { addCreateOrderMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import { get } from 'lodash';
import { Router } from '../server/pages';
import { FormattedMessage, defineMessages } from 'react-intl';
import CollectivesWithData from './CollectivesWithData';
import ExpensesSection from './ExpensesSection';
import UpdatesSection from './UpdatesSection';
import EventsWithData from './EventsWithData';
import TransactionsWithData from './TransactionsWithData';
import { Button } from 'react-bootstrap';
import { Link } from '../server/pages';
import SectionTitle from './SectionTitle';
import { formatCurrency } from '../lib/utils';

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

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'collective.created': { id: 'collective.created', defaultMessage: `Your collective has been created with success.`},
      'collective.created.description': { id: 'collective.created.description', defaultMessage: `While you are waiting for approval from your host ({host}), you can already customize your collective, file expenses and even create events.`},
      'collective.donate': { id: 'collective.donate', defaultMessage: `donate`},
      'collective.since': { id: 'usercollective.since', defaultMessage: `since {year}`},
      'collective.members.admin.title': { id: 'collective.members.admin.title', defaultMessage: `{n} {n, plural, one {core contributor} other {core contributors}}`},
      'collective.members.member.title': { id: 'collective.members.member.title', defaultMessage: `{n} {n, plural, one {member} other {members}}`},
      'collective.members.backer.title': { id: 'collective.members.backer.title', defaultMessage: `{n} {n, plural, one {backer} other {backers}}`},
      'collective.members.fundraiser.title': { id: 'collective.members.fundraiser.title', defaultMessage: `{n} {n, plural, one {fundraiser} other {fundraisers}}`},
      'collective.members.follower.title': { id: 'collective.members.follower.title', defaultMessage: `{n} {n, plural, one {follower} other {followers}}`},
      'collective.menu.host': { id: 'collective.menu.host', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.admin': { id: 'collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.member': { id: 'collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.backer': { id: 'collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.fundraiser': { id: 'collective.menu.fundraiser', defaultMessage: `raised money for {n} {n, plural, one {collective} other {collectives}}`},
      'collective.menu.follower': { id: 'collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    });
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
    // if (typeof window !== "undefined") {
    //   window.state = this.state;
    // }
  }

  resetOrder() {
    this.setState({ order: {} });
  }

  render() {
    const { intl, LoggedInUser, query } = this.props;
    const donateParams = { collectiveSlug: this.collective.slug, verb: 'donate' };
    if (query.referral) {
      donateParams.referral = query.referral;
    }
    const backersHash = this.collective.stats.backers.organizations > 0 ? '#organizations' : '#backers';
    const backgroundImage = this.collective.backgroundImage || get(this.collective,'parentCollective.backgroundImage') || defaultBackgroundImage;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(this.collective);
    const notification = {};
    if (get(query, 'status') === 'collectiveCreated') {
      notification.title = intl.formatMessage(this.messages['collective.created']);
      notification.description = intl.formatMessage(this.messages['collective.created.description'], { host: this.collective.host.name });
    }

    return (
      <div className={`CollectivePage ${this.collective.type}`}>
        <style jsx>{`
          .sidebar {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .longDescription {
            margin-top: 3rem;
          }
          .tier {
            text-align: center;
            font-size: 1.4rem;
          }
          section {
            max-width: 1244px;
            margin: 0 auto 5rem;
          }
          #events .eventsList {
            padding-left: 3rem;
          }
          .cardsList {
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: center;
          }
          .balance {
            text-align: center;
          }
          .balance label {
            margin: 0 0.5rem;
            font-weight: 500;
          }
          .actions {
            text-align: center;
          }
          .actions :global(button.btn) {
            margin-right: 5px;
          }
          @media(min-width: 600px) {
            .sidebar {
              float: right;
              margin: 3rem;
            }
          }
        `}</style>

        <Header
          title={this.collective.name}
          description={this.collective.description || this.collective.longDescription}
          twitterHandle={this.collective.twitterHandle || get(this.collective.parentCollective, 'twitterHandle')}
          image={this.collective.image || get(this.collective.parentCollective, 'image') || backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          href={`/${this.collective.slug}`}
          />

        <Body>

          <div className="CollectivePage">

            <NotificationBar
              status={this.state.status}
              title={notification.title}
              description={notification.description}
              error={this.state.error}
              />

            <CollectiveCover
              collective={this.collective}
              cta={{ href: `#contribute`, label: 'contribute' }}
              LoggedInUser={LoggedInUser}
              />

            <div>
              <div>
                <div className="content" >

                  <div className="sidebar tiers" id="contribute">
                    { this.collective.tiers.map(tier => (
                      <TierCard
                        key={`TierCard-${tier.slug}`}
                        collective={this.collective}
                        tier={tier}
                        referral={query.referral}
                        />
                    ))}
                    <div className="CustomDonationTierCard">
                      <Link route={`/${this.collective.slug}/donate`}>
                        <a><FormattedMessage id="collective.tiers.donate" defaultMessage="Or make a one time donation" /></a>
                      </Link>
                    </div>
                  </div>

                  { (get(this.collective, 'stats.updates') > 0 || canEditCollective) &&
                    <UpdatesSection
                      LoggedInUser={LoggedInUser}
                      collective={this.collective}
                      />
                  }

                  { get(this.collective, 'stats.events') > 0 || canEditCollective &&
                    <section id="events">
                      <SectionTitle section="events" />
                      <div className="eventsList">
                        <EventsWithData collectiveSlug={this.collective.slug} />
                      </div>
                    </section>
                  }
                  <section id="about" className="longDescription" >
                    <SectionTitle
                      title={<FormattedMessage id="collective.about.title" defaultMessage="About" />}
                      subtitle={`${(this.collective.description || '').trim()}, ${intl.formatMessage(this.messages['collective.since'], { year: new Date(this.collective.createdAt).getFullYear()})}`}
                      />

                    <Markdown source={this.collective.longDescription || ''} />
                  </section>
                </div>
              </div>

              { get(this.collective, 'stats.collectives.memberOf') > 0 &&
                <section id="members" className="clear">
                  <div className="content" >
                    <SectionTitle
                      title={<FormattedMessage
                        id="collective.collective.memberOf.collective.parent.title"
                        defaultMessage={`Member collectives`}
                      />}
                      subtitle={(<FormattedMessage
                        id="collective.collective.memberOf.collective.parent.subtitle"
                        values={{ n: this.collective.stats.collectives.memberOf }}
                        defaultMessage={`{n, plural, one {this collective is} other {{n} collectives are}} part of our collective`}
                      />)}
                      />

                    <div className="cardsList">
                      <CollectivesWithData
                        ParentCollectiveId={this.collective.id}
                        orderBy="balance"
                        type="COLLECTIVE"
                        orderDirection="DESC"
                        limit={20}
                        />
                    </div>
                  </div>
                </section>
              }

              <section id="budget" className="clear">
                <div className="content" >
                  <SectionTitle section="budget" values={{ balance: formatCurrency(get(this.collective, 'stats.balance'), this.collective.currency) }}/>

                  <ExpensesSection
                    collective={this.collective}
                    LoggedInUser={LoggedInUser}
                    limit={10}
                    />

                </div>
              </section>

              <section id="contributors" className="tier">
                <div className="content" >
                { get(this.collective, 'stats.backers.all') === 0 &&
                  <SectionTitle
                    section="contributors"
                    subtitle={<FormattedMessage id="collective.section.contributors.empty" defaultMessage="You don't have any contributors yet." />}
                    />
                }
                { get(this.collective, 'stats.backers.all') > 0 &&
                  <div>
                    <SectionTitle
                      section="contributors"
                      values={ get(this.collective, 'stats.backers') }
                      />

                    <MembersWithData
                      collective={this.collective}
                      type="ORGANIZATION"
                      LoggedInUser={LoggedInUser}
                      role='BACKER'
                      limit={100}
                      />
                
                    <MembersWithData
                      collective={this.collective}
                      LoggedInUser={LoggedInUser}
                      type="USER"
                      role='BACKER'
                      limit={100}
                      orderBy="totalDonations"
                      />
                  </div>
                }
                </div>
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

import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import Tier from './Tier';
import NotificationBar from './NotificationBar';
import Memberships from './Memberships';
import CollectivesWithData from './CollectivesWithData';
import Markdown from 'react-markdown';
import { defineMessages, FormattedMessage } from 'react-intl';
import { pick, get, groupBy } from 'lodash';
import HashLink from 'react-scrollchor';
import MenuBar from './MenuBar';
import MessageModal from './MessageModal';
import OrderCreated from './OrderCreated';
import { Button } from 'react-bootstrap';
import { Router, Link } from '../server/pages';

class UserCollective extends React.Component {

  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.collective = this.props.collective; // pre-loaded by SSR

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'organization.created': { id: 'organization.created', defaultMessage: `Your organization has been created with success.`},
      'organization.created.description': { id: 'organization.created.description', defaultMessage: `You can now make contributions as an organization. You can also edit your organization profile, add members and other administrators and attach a credit card that can be used by its members within a monthly limit.`},
      'organization.collective.since': { id: 'organization.collective.since', defaultMessage: `Contributing Since {year}`},
      'user.collective.since': { id: 'user.collective.since', defaultMessage: `Contributing Since {year}`},
      'organization.collective.edit': { id: 'organization.collective.edit', defaultMessage: `edit organization`},
      'user.collective.edit': { id: 'user.collective.edit', defaultMessage: `edit profile`},
      'user.collective.memberOf.host.title': { id: 'user.collective.memberOf.host.title', defaultMessage: `I'm hosting {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.admin.title': { id: 'user.collective.memberOf.admin.title', defaultMessage: `I'm a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.member.title': { id: 'user.collective.memberOf.member.title', defaultMessage: `I'm a member of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.backer.title': { id: 'user.collective.memberOf.backer.title', defaultMessage: `I'm backing {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.attendee.title': { id: 'user.collective.memberOf.attendee.title', defaultMessage: `I've attended {n, plural, one {this event} other {these events}}`},
      'user.collective.memberOf.fundraiser.title': { id: 'user.collective.memberOf.fundraiser.title', defaultMessage: `I've helped raise money for {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.fundraiser.LoggedInDescription': { id: 'user.collective.memberOf.fundraiser.LoggedInDescription', defaultMessage: `Share the URL in the email receipt for each of your donation to track how much money you helped raised! (Alternatively, you can also click on any collective that you are contributing to on this page. We will add your referral id to the URL.)`},
      'user.collective.memberOf.follower.title': { id: 'user.collective.memberOf.follower.title', defaultMessage: `I'm following {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.host.title': { id: 'organization.collective.memberOf.host.title', defaultMessage: `We are hosting {n, plural, one {this collective} other {{n} collectives}}`},
      'organization.collective.memberOf.admin.title': { id: 'organization.collective.memberOf.admin.title', defaultMessage: `We are a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.member.title': { id: 'organization.collective.memberOf.member.title', defaultMessage: `We are a member of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.backer.title': { id: 'organization.collective.memberOf.backer.title', defaultMessage: `We are backing {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.follower.title': { id: 'organization.collective.memberOf.follower.title', defaultMessage: `We are following {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.fundraiser.title': { id: 'organization.collective.memberOf.fundraiser.title', defaultMessage: `We've helped raise money for {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.menu.host': { id: 'user.collective.menu.host', defaultMessage: `hosting {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.admin': { id: 'user.collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.host': { id: 'user.collective.menu.host', defaultMessage: `hosting {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.member': { id: 'user.collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.backer': { id: 'user.collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.attendee': { id: 'user.collective.menu.attendee', defaultMessage: `attended {n} {n, plural, one {event} other {events}}`},
      'user.collective.menu.fundraiser': { id: 'user.collective.menu.fundraiser', defaultMessage: `raised money for {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.follower': { id: 'user.collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    })

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  render() {
    const order = { fromCollective: this.collective };
    const { intl, LoggedInUser, query } = this.props;

    const type = this.collective.type.toLowerCase();
    let cta;
    if (this.collective.canApply) {
      cta = <a href={`/${this.collective.slug}/apply`}><FormattedMessage id="host.apply" defaultMessage="Apply to create a collective" /></a>
    }
    const memberOf = groupBy(this.collective.memberOf, 'role');
    const actions = [];
    Object.keys(memberOf).map(role => {
      actions.push(
        {
          className: 'whiteblue',
          component: <HashLink to={`#${role}`}>{intl.formatMessage(this.messages[`user.collective.menu.${role.toLowerCase()}`], { n: memberOf[role].length })}</HashLink>
        }
      );
    });

    if (LoggedInUser && LoggedInUser.canEditCollective(this.collective)) {
      actions.push({
        className: 'whiteblue small allcaps',
        component: <Link route={`/${this.collective.slug}/edit`}><a>{intl.formatMessage(this.messages[`${type}.collective.edit`])}</a></Link>
      });
    }

    const notification = {};
    if (query && query.CollectiveId) {
      if (query.status === 'collectiveCreated' && this.collective.type === 'ORGANIZATION') {
        notification.title = intl.formatMessage(this.messages['organization.created']);
        notification.description = intl.formatMessage(this.messages['organization.created.description']);
      }
      Object.assign(order, {
        ...order,
        ...pick(query || {}, 'totalAmount', 'CollectiveId', 'TierId'),
        collective: (this.collective.memberOf.find(m => m.collective.id === parseInt(query.CollectiveId)) || {}).collective
      });
    }

    return (
      <div className="UserCollectivePage">
        <style jsx>{`
          h1 {
            font-size: 2rem;
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
          .cardsList {
            margin: 0 2rem;
          }
          .description {
            font-size: 1.4rem;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
          }
          #tiers {
            overflow: hidden;
            width: 100%;
            display: flex;
          }
          #tiers :global(.tier) {
            margin: 4rem auto;
            max-width: 300px;
            float: left;
          }
        `}</style>

        <Header
          title={this.collective.name}
          description={this.collective.description || this.collective.longDescription}
          twitterHandle={this.collective.twitterHandle || get(this.collective.parentCollective, 'twitterHandle')}
          image={get(this.collective.parentCollective, 'image')}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          href={`/${this.collective.slug}`}
          />

        <Body>

          <div>

            <NotificationBar
              status={this.state.status}
              title={notification.title}
              description={notification.description}
              error={this.state.error}
              />

            { this.props.message && <MessageModal message={this.props.message} /> }

            <CollectiveCover
              collective={this.collective}
              cta={cta}
              />

            <MenuBar
              info={intl.formatMessage(this.messages[`${type}.collective.since`], { year: (new Date(this.collective.createdAt)).getFullYear() })}
              actions={actions}
              />

            <div>

              { (get(query, 'status') === 'orderCreated' || get(query, 'status') === 'orderProcessing') &&  <OrderCreated order={order} status={query.status} /> }

              <div className="content" >
                <div className="message">
                  { query && query.status && (!this.collective.image || !this.collective.longDescription) &&
                    <div>
                      <FormattedMessage id="collective.user.emptyProfile" defaultMessage={`Your profile looks a bit empty ¯\\\\_(ツ)_/¯`} />
                    </div>
                  }
                  { !LoggedInUser && (!this.collective.image || !this.collective.longDescription) &&
                    <div>
                      <FormattedMessage id="collective.user.loggedout.editProfile" defaultMessage="Please login to edit your profile" />
                    </div>
                  }
                  { LoggedInUser && (!this.collective.image || !this.collective.longDescription) &&
                    <div className="editBtn">
                      <Button onClick={() => Router.pushRoute(`/${this.collective.slug}/edit`)}>{intl.formatMessage(this.messages[`${type}.collective.edit`])}</Button>
                    </div>
                  }
                </div>
                { this.collective.longDescription &&
                  <div className="longDescription" >
                    <Markdown source={this.collective.longDescription} />
                  </div>
                }
                <div id="tiers">
                  {this.collective.tiers.map((tier) =>
                    <Tier
                      key={tier.id}
                      className="tier"
                      tier={tier}
                      onChange={(tier) => this.updateOrder(tier)}
                      onClick={(tier) => this.handleOrderTier(tier)}
                      />
                  )}
                </div>
              </div>
              { this.collective.stats.collectives > 0 &&
                <section id="hosting">
                  <h1>
                    {intl.formatMessage(this.messages[`${type}.collective.memberOf.host.title`], { n: this.collective.stats.collectives })}
                  </h1>
                  <div className="adminActions" id="adminActions">
                    <ul>
                      { LoggedInUser && LoggedInUser.canEditCollective(this.collective) &&
                        <li><Link route={`/${this.collective.slug}/collectives/expenses`}><a><FormattedMessage id="host.collectives.manage" defaultMessage="Manage expenses" /></a></Link></li>
                      }
                      { this.collective.settings.apply &&
                        <li><a href={`/${this.collective.slug}/apply`}><FormattedMessage id="host.apply" defaultMessage="Apply to create a collective" /></a></li>
                      }
                    </ul>
                  </div>

                  <div className="cardsList">
                    <CollectivesWithData
                      HostCollectiveId={this.collective.id}
                      orderBy="balance"
                      orderDirection="DESC"
                      limit={20}
                      />
                  </div>
                </section>
              }
              { Object.keys(memberOf).map(role => role !== 'HOST' && (
                <section id={role}>
                  <h1>{intl.formatMessage(this.messages[`${type}.collective.memberOf.${role.toLowerCase()}.title`], { n: memberOf[role].length })}</h1>
                  { LoggedInUser && this.messages[`user.collective.memberOf.${role.toLowerCase()}.LoggedInDescription`] &&
                    <div className="description">{intl.formatMessage(this.messages[`user.collective.memberOf.${role.toLowerCase()}.LoggedInDescription`])}</div>
                  }
                  <Memberships
                    className={role}
                    LoggedInUser={LoggedInUser}
                    memberships={role === 'ADMIN' ? memberOf[role].filter(m => m.collective.type === 'COLLECTIVE') : memberOf[role]}
                    />
                </section>
              ))}

            </div>
          </div>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(UserCollective);

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
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    query: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.collective = this.props.collective; // pre-loaded by SSR
    this.memberOfByRole = groupBy(this.collective.memberOf, 'role');

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'host.apply': { id: 'host.apply', defaultMessage: "Apply to create a collective" },
      'organization.created': { id: 'organization.created', defaultMessage: `Your organization has been created with success.`},
      'organization.created.description': { id: 'organization.created.description', defaultMessage: `You can now make contributions as an organization. You can also edit your organization profile, add members and other administrators and attach a credit card that can be used by its members within a monthly limit.`},
      'organization.collective.since': { id: 'organization.collective.since', defaultMessage: `Contributing Since {year}`},
      'user.collective.since': { id: 'user.collective.since', defaultMessage: `Contributing Since {year}`},
      'organization.collective.edit': { id: 'organization.collective.edit', defaultMessage: `edit organization`},
      'user.collective.edit': { id: 'user.collective.edit', defaultMessage: `edit profile`},
      'user.collective.memberOf.collective.host.title': { id: 'user.collective.memberOf.collective.host.title', defaultMessage: `I'm hosting {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.organization.admin.title': { id: 'user.collective.memberOf.organization.admin.title', defaultMessage: `I'm an administrator of {n, plural, one {this organization} other {these organizations}}`},
      'user.collective.memberOf.organization.member.title': { id: 'user.collective.memberOf.organization.member.title', defaultMessage: `I'm a member of {n, plural, one {this organization} other {these organizations}}`},
      'user.collective.memberOf.collective.admin.title': { id: 'user.collective.memberOf.collective.admin.title', defaultMessage: `I'm a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.collective.member.title': { id: 'user.collective.memberOf.collective.member.title', defaultMessage: `I'm a member of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.collective.backer.title': { id: 'user.collective.memberOf.collective.backer.title', defaultMessage: `I'm backing {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.event.attendee.title': { id: 'user.collective.memberOf.event.attendee.title', defaultMessage: `I've attended {n, plural, one {this event} other {these events}}`},
      'user.collective.memberOf.collective.fundraiser.title': { id: 'user.collective.memberOf.collective.fundraiser.title', defaultMessage: `I've helped raise money for {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.collective.fundraiser.LoggedInDescription': { id: 'user.collective.memberOf.collective.fundraiser.LoggedInDescription', defaultMessage: `Share the URL in the email receipt for each of your donation to track how much money you helped raised! (Alternatively, you can also click on any collective that you are contributing to on this page. We will add your referral id to the URL.)`},
      'user.collective.memberOf.collective.follower.title': { id: 'user.collective.memberOf.collective.follower.title', defaultMessage: `I'm following {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.collective.host.title': { id: 'organization.collective.memberOf.collective.host.title', defaultMessage: `We are hosting {n, plural, one {this collective} other {{n} collectives}}`},
      'organization.collective.memberOf.collective.admin.title': { id: 'organization.collective.memberOf.collective.admin.title', defaultMessage: `We are a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.collective.member.title': { id: 'organization.collective.memberOf.collective.member.title', defaultMessage: `We are a member of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.collective.backer.title': { id: 'organization.collective.memberOf.collective.backer.title', defaultMessage: `We are backing {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.collective.follower.title': { id: 'organization.collective.memberOf.collective.follower.title', defaultMessage: `We are following {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.collective.fundraiser.title': { id: 'organization.collective.memberOf.collective.fundraiser.title', defaultMessage: `We've helped raise money for {n, plural, one {this collective} other {these collectives}}`},
      'menu.host': { id: 'user.collective.menu.host', defaultMessage: `hosting {n} {n, plural, one {collective} other {collectives}}`},
      'menu.admin': { id: 'user.collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'menu.host': { id: 'user.collective.menu.host', defaultMessage: `hosting {n} {n, plural, one {collective} other {collectives}}`},
      'menu.member': { id: 'user.collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'menu.backer': { id: 'user.collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'menu.attendee': { id: 'user.collective.menu.attendee', defaultMessage: `attended {n} {n, plural, one {event} other {events}}`},
      'menu.fundraiser': { id: 'user.collective.menu.fundraiser', defaultMessage: `raised money for {n} {n, plural, one {collective} other {collectives}}`},
      'menu.follower': { id: 'user.collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    })

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  renderRole(role) {
    const { intl, collective, LoggedInUser } = this.props;
    const type = collective.type.toLowerCase();

    const renderRoleForType = (memberOfCollectiveType) => {
      const collectiveType = memberOfCollectiveType.toLowerCase();
      const title = this.messages[`${type}.collective.memberOf.${collectiveType}.${role.toLowerCase()}.title`];
      if (!title) return;
      const memberships = this.memberOfByRole[role].filter(m => get(m, 'collective.type') === memberOfCollectiveType);
      if (memberships.length === 0) return;
      return (
        <section id={role.toLowerCase()} className={collectiveType}>
          <h1>{intl.formatMessage(title, { n: this.memberOfByRole[role].length })}</h1>
          { LoggedInUser && this.messages[`${type}.collective.memberOf.${collectiveType}.${role.toLowerCase()}.LoggedInDescription`] &&
            <div className="description">{intl.formatMessage(this.messages[`${type}.collective.memberOf.${collectiveType}.${role.toLowerCase()}.LoggedInDescription`])}</div>
          }
          <Memberships
            className={role}
            LoggedInUser={LoggedInUser}
            memberships={memberships}
            />
        </section>
      )
    }

    return (
      <div>
        { renderRoleForType('ORGANIZATION') }
        { renderRoleForType('COLLECTIVE') }
        { renderRoleForType('EVENT') }
      </div>
    )

  }

  render() {
    const order = { fromCollective: this.collective };
    const { intl, LoggedInUser, query } = this.props;
    const isProfileEmpty = !(this.collective.description || this.collective.longDescription);
    const type = this.collective.type.toLowerCase();
    let cta;
    if (this.collective.canApply) {
      cta = { href: `/${this.collective.slug}/apply`, label: intl.formatMessage(this.messages['host.apply']) }
    }
    const actions = [];
    Object.keys(this.memberOfByRole).map(role => {
      if (!this.messages[`menu.${role.toLowerCase()}`]) return;
      const n = (role === 'ADMIN') ? this.memberOfByRole[role].filter(c => get(c, 'collective.type') === 'COLLECTIVE').length : this.memberOfByRole[role].length;
      actions.push(
        {
          className: 'whiteblue',
          component: <HashLink to={`#${role.toLowerCase()}`}>{intl.formatMessage(this.messages[`menu.${role.toLowerCase()}`], { n })}</HashLink>
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
          .message {
            margin: 5rem;
            text-align: center;
          }
          .message .editBtn {
            margin: 2rem;
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
                  { isProfileEmpty && LoggedInUser && LoggedInUser.canEditCollective(this.collective) &&
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

              { get(this.collective, 'stats.collectives.host') > 0 &&
                <section id="hosting">
                  <h1>
                    <FormattedMessage
                      id="organization.collective.memberOf.collective.host.title"
                      values={{ n: this.collective.stats.collectives.host }}
                      defaultMessage={`We are hosting {n, plural, one {this collective} other {{n} collectives}}`}
                      />
                  </h1>
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

              { get(this.collective, 'stats.collectives.parent') > 0 &&
                <section id="parenting">
                  <h1>
                    <FormattedMessage
                      id="organization.collective.memberOf.collective.parent.title"
                      values={{ n: this.collective.stats.collectives.parent }}
                      defaultMessage={`{n, plural, one {this collective is} other {{n} collectives are}} part of our organization`}
                      />
                  </h1>
                  <div className="cardsList">
                    <CollectivesWithData
                      ParentCollectiveId={this.collective.id}
                      orderBy="balance"
                      orderDirection="DESC"
                      limit={20}
                      />
                  </div>
                </section>
              }

              { Object.keys(this.memberOfByRole).map(role => role !== 'HOST' && this.renderRole(role)) }

            </div>
          </div>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(UserCollective);

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
import MessageModal from './MessageModal';
import SectionTitle from './SectionTitle';
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
      'organization.created': { id: 'organization.created', defaultMessage: `Your organization has been created with success.`},
      'organization.created.description': { id: 'organization.created.description', defaultMessage: `You can now make contributions as an organization. You can also edit your organization profile, add members and other administrators and attach a credit card that can be used by its members within a monthly limit.`},
      'organization.collective.since': { id: 'organization.collective.since', defaultMessage: `Contributing Since {year}`},
      'user.collective.since': { id: 'user.collective.since', defaultMessage: `Contributing Since {year}`},
      'organization.collective.edit': { id: 'organization.collective.edit', defaultMessage: `edit organization`},
      'user.collective.edit': { id: 'user.collective.edit', defaultMessage: `edit profile`},
      'user.collective.memberOf.collective.host.title': { id: 'user.collective.memberOf.collective.host.title', defaultMessage: `I'm hosting {n, plural, one {this collective} other {these {n} collectives}}`},
      'user.collective.memberOf.organization.admin.title': { id: 'user.collective.memberOf.organization.admin.title', defaultMessage: `I'm an administrator of {n, plural, one {this organization} other {these {n} organizations}}`},
      'user.collective.memberOf.organization.member.title': { id: 'user.collective.memberOf.organization.member.title', defaultMessage: `I'm a member of {n, plural, one {this organization} other {these {n} organizations}}`},
      'user.collective.memberOf.collective.admin.title': { id: 'user.collective.memberOf.collective.admin.title', defaultMessage: `I'm a core contributor of {n, plural, one {this collective} other {these {n} collectives}}`},
      'user.collective.memberOf.collective.member.title': { id: 'user.collective.memberOf.collective.member.title', defaultMessage: `I'm a member of {n, plural, one {this collective} other {these {n} collectives}}`},
      'user.collective.memberOf.collective.backer.title': { id: 'user.collective.memberOf.collective.backer.title', defaultMessage: `I'm backing {n, plural, one {this collective} other {these {n} collectives}}`},
      'user.collective.memberOf.event.attendee.title': { id: 'user.collective.memberOf.event.attendee.title', defaultMessage: `I've attended {n, plural, one {this event} other {these {n} events}}`},
      'user.collective.memberOf.collective.fundraiser.title': { id: 'user.collective.memberOf.collective.fundraiser.title', defaultMessage: `I've helped raise money for {n, plural, one {this collective} other {these {n} collectives}}`},
      'user.collective.memberOf.collective.fundraiser.LoggedInDescription': { id: 'user.collective.memberOf.collective.fundraiser.LoggedInDescription', defaultMessage: `Share the URL in the email receipt for each of your donation to track how much money you helped raised! (Alternatively, you can also click on any collective that you are contributing to on this page. We will add your referral id to the URL.)`},
      'user.collective.memberOf.collective.follower.title': { id: 'user.collective.memberOf.collective.follower.title', defaultMessage: `I'm following {n, plural, one {this collective} other {these {n} collectives}}`},
      'organization.collective.memberOf.collective.host.title': { id: 'organization.collective.memberOf.collective.host.title', defaultMessage: `We are hosting {n, plural, one {this collective} other {{n} collectives}}`},
      'organization.collective.memberOf.collective.admin.title': { id: 'organization.collective.memberOf.collective.admin.title', defaultMessage: `We are a core contributor of {n, plural, one {this collective} other {these {n} collectives}}`},
      'organization.collective.memberOf.collective.member.title': { id: 'organization.collective.memberOf.collective.member.title', defaultMessage: `We are a member of {n, plural, one {this collective} other {these {n} collectives}}`},
      'organization.collective.memberOf.collective.backer.title': { id: 'organization.collective.memberOf.collective.backer.title', defaultMessage: `We are backing {n, plural, one {this collective} other {these {n} collectives}}`},
      'organization.collective.memberOf.collective.follower.title': { id: 'organization.collective.memberOf.collective.follower.title', defaultMessage: `We are following {n, plural, one {this collective} other {these {n} collectives}}`},
      'organization.collective.memberOf.collective.fundraiser.title': { id: 'organization.collective.memberOf.collective.fundraiser.title', defaultMessage: `We've helped raise money for {n, plural, one {this collective} other {these {n} collectives}}`},
      'section.host': { id: 'section.host', defaultMessage: `Hosting`},
      'section.admin': { id: 'section.admin', defaultMessage: `Administrating`},
      'section.host': { id: 'section.host', defaultMessage: `Hosting`},
      'section.member': { id: 'section.member', defaultMessage: `Memberships`},
      'section.backer': { id: 'section.backer', defaultMessage: `Backing`},
      'section.attendee': { id: 'section.attendee', defaultMessage: `Events`},
      'section.fundraiser': { id: 'section.fundraiser', defaultMessage: `Fund raising`},
      'section.follower': { id: 'section.follower', defaultMessage: `Following`},
    })

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  renderRole(role) {
    const { intl, collective, LoggedInUser } = this.props;
    const type = collective.type.toLowerCase();

    const renderRoleForType = (memberOfCollectiveType) => {
      if (role === 'ADMIN' && memberOfCollectiveType === 'EVENT') return;

      const memberships = this.memberOfByRole[role].filter(m => get(m, 'collective.type') === memberOfCollectiveType);
      if (memberships.length === 0) return;

      let title, subtitle;
      const collectiveType = memberOfCollectiveType.toLowerCase();
      const titleMessageId = `section.${role.toLowerCase()}`;
      const values = { n: memberships.length };
      title = this.messages[titleMessageId] && intl.formatMessage(this.messages[titleMessageId], values);
      if (!title) return;
      const subtitleMessageId = `${type}.collective.memberOf.${collectiveType}.${role.toLowerCase()}.title`;
      const loggedInSubtitleMessageId = `${type}.collective.memberOf.${collectiveType}.${role.toLowerCase()}.LoggedInDescription`;
      if (LoggedInUser && this.messages[loggedInSubtitleMessageId]) {
        subtitle = intl.formatMessage(this.messages[subtitleMessageId], values);
      } else if (this.messages[subtitleMessageId]) {
        subtitle = intl.formatMessage(this.messages[subtitleMessageId], values);
      }

      return (
        <section id={role.toLowerCase()} className={collectiveType} key={`${role}-${memberOfCollectiveType}`}>
          <div className="content">
            <SectionTitle
              title={title}
              subtitle={subtitle}
              />

            <Memberships
              className={role}
              LoggedInUser={LoggedInUser}
              memberships={memberships}
              />
          </div>
        </section>
      )
    }

    return (
      <div key={role}>
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
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(this.collective);
    const type = this.collective.type.toLowerCase();
    let cta;
    if (this.collective.canApply) {
      cta = { href: `/${this.collective.slug}/apply`, label: 'apply' }
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
              LoggedInUser={LoggedInUser}
              />

            <div>

              { (get(query, 'status') === 'orderCreated' || get(query, 'status') === 'orderProcessing') &&  <OrderCreated order={order} type={query.type} status={query.status} /> }

              { /* Make sure we don't show an empty div.content if no description unless canEditCollective */ }
              { (this.collective.longDescription || canEditCollective) &&
                <div className="content" >
                  { isProfileEmpty && canEditCollective &&
                    <div className="message">
                      <div className="editBtn">
                        <Button onClick={() => Router.pushRoute(`/${this.collective.slug}/edit`)}>{intl.formatMessage(this.messages[`${type}.collective.edit`])}</Button>
                      </div>
                    </div>
                  }
                  { this.collective.longDescription &&
                    <section id="about" className="longDescription" >
                      <Markdown source={this.collective.longDescription} />
                    </section>
                  }
                </div>
              }

              { get(this.collective, 'stats.collectives.hosted') > 0 &&
                <section id="hosting">
                  <h1>
                    <FormattedMessage
                      id="organization.collective.memberOf.collective.host.title"
                      values={{ n: this.collective.stats.collectives.hosted }}
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

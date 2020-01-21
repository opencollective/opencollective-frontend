import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import Link from './Link';
import NotificationBar from './NotificationBar';
import Memberships from './Memberships';
import CollectivesWithData from './CollectivesWithData';
import LongDescription from './LongDescription';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { pick, get, groupBy, uniqBy } from 'lodash';
import MessageModal from './MessageModal';
import SectionTitle from './SectionTitle';
import ApplyToHostBtn from './ApplyToHostBtn';
import { Button } from 'react-bootstrap';
import { Router } from '../server/pages';

class UserCollective extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    query: PropTypes.object,
    intl: PropTypes.object.isRequired,
    message: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.classNames = ['UserCollectivePage'];
    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    this.messages = defineMessages({
      'organization.created': {
        id: 'organization.created',
        defaultMessage: 'Your Organization has been created.',
      },
      'organization.created.description': {
        id: 'organization.created.description',
        defaultMessage:
          'You can now make financial contributions as an Organization. You can also edit your Organization profile, add team members and admins, and attach a credit card with a monthly limit.',
      },
      'organization.isArchived': {
        id: 'organization.isArchived',
        defaultMessage: '{name} has been archived.',
      },
      'organization.isArchived.description': {
        id: 'organization.isArchived.description',
        defaultMessage: 'This Organization has been archived and is no longer active.',
      },
      'user.isArchived': {
        id: 'user.isArchived',
        defaultMessage: 'Account has been archived.',
      },
      'user.isArchived.description': {
        id: 'user.isArchived.description',
        defaultMessage: 'This account has been archived and is no longer active.',
      },
      'organization.collective.since': {
        id: 'organization.collective.since',
        defaultMessage: 'Contributing Since {year}',
      },
      'user.collective.since': {
        id: 'user.collective.since',
        defaultMessage: 'Contributing Since {year}',
      },
      'organization.collective.edit': {
        id: 'organization.collective.edit',
        defaultMessage: 'edit Organization',
      },
      'user.collective.edit': {
        id: 'user.collective.edit',
        defaultMessage: 'edit profile',
      },
      'user.collective.memberOf.collective.host.title': {
        id: 'user.collective.memberOf.collective.host.title',
        defaultMessage: "I'm hosting {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'user.collective.memberOf.organization.admin.title': {
        id: 'user.collective.memberOf.organization.admin.title',
        defaultMessage: "I'm an admin of {n, plural, one {this Organization} other {these {n} Organizations}}",
      },
      'user.collective.memberOf.organization.member.title': {
        id: 'user.collective.memberOf.organization.member.title',
        defaultMessage: "I'm a team member of {n, plural, one {this Organization} other {these {n} Organizations}}",
      },
      'user.collective.memberOf.collective.admin.title': {
        id: 'user.collective.memberOf.collective.admin.title',
        defaultMessage:
          "I'm a Core Contributor and admin of {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'user.collective.memberOf.collective.member.title': {
        id: 'user.collective.memberOf.collective.member.title',
        defaultMessage: "I'm a Core Contributor of {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'user.collective.memberOf.collective.backer.title': {
        id: 'user.collective.memberOf.collective.backer.title',
        defaultMessage:
          "I'm financially contributing to {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'user.collective.memberOf.event.attendee.title': {
        id: 'user.collective.memberOf.event.attendee.title',
        defaultMessage: "I've attended {n, plural, one {this event} other {these {n} events}}",
      },
      'user.collective.memberOf.collective.fundraiser.title': {
        id: 'user.collective.memberOf.collective.fundraiser.title',
        defaultMessage: "I've helped raise money for {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'user.collective.memberOf.collective.fundraiser.LoggedInDescription': {
        id: 'user.collective.memberOf.collective.fundraiser.LoggedInDescription',
        defaultMessage:
          'Share the URL in the email receipt for each of your donation to track how much money you helped raised! (Alternatively, you can also click on any collective that you are contributing to on this page. We will add your referral id to the URL.)',
      },
      'user.collective.memberOf.collective.follower.title': {
        id: 'user.collective.memberOf.collective.follower.title',
        defaultMessage: "I'm following {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'organization.collective.memberOf.collective.host.title': {
        id: 'organization.collective.memberOf.collective.host.title',
        defaultMessage: 'We are fiscally hosting {n, plural, one {this Collective} other {{n} Collectives}}',
      },
      'organization.collective.memberOf.collective.admin.title': {
        id: 'organization.collective.memberOf.collective.admin.title',
        defaultMessage:
          'We are a Core Contributor and admin of {n, plural, one {this Collective} other {these {n} Collectives}}',
      },
      'organization.collective.memberOf.collective.member.title': {
        id: 'organization.collective.memberOf.collective.member.title',
        defaultMessage: 'We are a Core Contributor of {n, plural, one {this Collective} other {these {n} Collectives}}',
      },
      'organization.collective.memberOf.collective.backer.title': {
        id: 'organization.collective.memberOf.collective.backer.title',
        defaultMessage:
          'We are financial contributors to {n, plural, one {this Collective} other {these {n} Collectives}}',
      },
      'organization.collective.memberOf.collective.follower.title': {
        id: 'organization.collective.memberOf.collective.follower.title',
        defaultMessage: 'We are following {n, plural, one {this Collective} other {these {n} Collectives}}',
      },
      'organization.collective.memberOf.collective.fundraiser.title': {
        id: 'organization.collective.memberOf.collective.fundraiser.title',
        defaultMessage: "We've helped raise money for {n, plural, one {this Collective} other {these {n} Collectives}}",
      },
      'section.host': { id: 'section.host', defaultMessage: 'Fiscally hosting' },
      'section.admin': {
        id: 'section.admin',
        defaultMessage: 'Administrating',
      },
      'section.member': { id: 'section.member', defaultMessage: 'Core Contributor' },
      'section.backer': { id: 'section.backer', defaultMessage: 'Financial contributor' },
      'section.attendee': { id: 'section.attendee', defaultMessage: 'Events' },
      'section.fundraiser': {
        id: 'section.fundraiser',
        defaultMessage: 'Fund raising',
      },
      'section.follower': {
        id: 'section.follower',
        defaultMessage: 'Following',
      },
    });
  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  renderRole(role) {
    const { intl, collective, LoggedInUser } = this.props;
    const type = collective.type.toLowerCase();
    const memberOfByRole = groupBy(collective.memberOf, 'role');

    const renderRoleForType = memberOfCollectiveType => {
      if (role === 'ADMIN' && memberOfCollectiveType === 'EVENT') {
        return;
      }

      let memberships = memberOfByRole[role].filter(m => get(m, 'collective.type') === memberOfCollectiveType);
      memberships = uniqBy(memberships, member => member.collective.id);
      if (memberships.length === 0) {
        return;
      }

      let subtitle;
      const collectiveType = memberOfCollectiveType.toLowerCase();
      const titleMessageId = `section.${role.toLowerCase()}`;
      const values = { n: memberships.length };
      const title = this.messages[titleMessageId] && intl.formatMessage(this.messages[titleMessageId], values);
      if (!title) {
        return;
      }
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
            <SectionTitle title={title} subtitle={subtitle} />

            <Memberships className={role} LoggedInUser={LoggedInUser} memberships={memberships} />
          </div>
        </section>
      );
    };

    return (
      <div key={role}>
        {renderRoleForType('ORGANIZATION')}
        {renderRoleForType('COLLECTIVE')}
        {renderRoleForType('EVENT')}
      </div>
    );
  }

  render() {
    const collective = this.props.collective;
    const memberOfByRole = groupBy(collective.memberOf, 'role');

    const order = { fromCollective: collective };
    const { intl, LoggedInUser, query } = this.props;
    const status = get(query, 'status');

    const isProfileEmpty = !(collective.description || collective.longDescription);
    const canEditCollective = LoggedInUser && !collective.isIncognito && LoggedInUser.canEditCollective(collective);
    const type = collective.type.toLowerCase();
    let cta;
    if (collective.canApply && !collective.isArchived) {
      cta = <ApplyToHostBtn LoggedInUser={LoggedInUser} host={collective} buttonStyle="primary" />;
    }

    const notification = {};
    if (query && query.CollectiveId) {
      if (query.status === 'collectiveCreated' && collective.type === 'ORGANIZATION') {
        notification.title = intl.formatMessage(this.messages['organization.created']);
        notification.description = intl.formatMessage(this.messages['organization.created.description']);
      }
      Object.assign(order, {
        ...order,
        ...pick(query || {}, 'totalAmount', 'CollectiveId', 'TierId'),
        collective: (
          (collective.memberOf || []).find(m => get(m, 'collective.id') === parseInt(query.CollectiveId)) || {}
        ).collective,
      });
    }

    if (collective.type === 'ORGANIZATION' && (status === 'collectiveArchived' || collective.isArchived)) {
      notification.title = intl.formatMessage(this.messages['organization.isArchived'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['organization.isArchived.description']);
      notification.status = 'collectiveArchived';
    } else if (collective.type === 'USER' && (status === 'collectiveArchived' || collective.isArchived)) {
      notification.title = intl.formatMessage(this.messages['user.isArchived'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['user.isArchived.description']);
      notification.status = 'collectiveArchived';
    }

    return (
      <div
        className={classNames('UserCollectivePage', {
          LoggedInUser: LoggedInUser ? true : false,
        })}
      >
        <style jsx>
          {`
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
            .archiveCollective {
              -webkit-filter: grayscale(100%);
              -moz-filter: grayscale(100%);
              -ms-filter: grayscale(100%);
              filter: grayscale(100%);
            }
          `}
        </style>

        <Header collective={collective} className={this.state.status} LoggedInUser={LoggedInUser} />

        <Body>
          <div className={classNames({ archiveCollective: collective.isArchived })}>
            <NotificationBar
              status={this.state.status}
              title={notification.title}
              description={notification.description}
              error={this.state.error}
            />

            {this.props.message && <MessageModal message={this.props.message} />}

            <CollectiveCover
              collective={collective}
              cta={cta}
              LoggedInUser={LoggedInUser}
              key={collective.slug}
              forceLegacy
            />

            <div>
              {/* Make sure we don't show an empty div.content if no description unless canEditCollective */}
              {(collective.longDescription || canEditCollective) && (
                <div className="content">
                  {isProfileEmpty && canEditCollective && (
                    <div className="message">
                      <div className="editBtn">
                        <Button data-cy="editBtn" onClick={() => Router.pushRoute(`/${collective.slug}/edit`)}>
                          {intl.formatMessage(this.messages[`${type}.collective.edit`])}
                        </Button>
                      </div>
                    </div>
                  )}
                  {collective.longDescription && (
                    <LongDescription
                      longDescription={collective.longDescription}
                      defaultSubtitle={collective.description}
                    />
                  )}
                </div>
              )}

              {get(collective, 'stats.collectives.hosted') > 0 && (
                <section id="hosting">
                  <h1>
                    <FormattedMessage
                      id="organization.collective.memberOf.collective.host.title"
                      values={{ n: collective.stats.collectives.hosted }}
                      defaultMessage={
                        'We are fiscally hosting {n, plural, one {this Collective} other {{n} Collectives}}'
                      }
                    />
                  </h1>
                  {LoggedInUser && LoggedInUser.canEditCollective(collective) && (
                    <div className="adminActions" id="adminActions">
                      <ul>
                        <li>
                          <Link route={`/${collective.slug}/dashboard`}>
                            <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                  <div className="cardsList">
                    <CollectivesWithData
                      HostCollectiveId={collective.id}
                      type="COLLECTIVE"
                      orderBy="balance"
                      orderDirection="DESC"
                      limit={20}
                    />
                  </div>
                </section>
              )}

              {get(collective, 'stats.collectives.memberOf') > 0 && (
                <section id="parenting">
                  <h1>
                    <FormattedMessage
                      id="organization.collective.memberOf.collective.parent.title"
                      values={{ n: collective.stats.collectives.memberOf }}
                      defaultMessage={
                        '{n, plural, one {this Collective is} other {{n} Collectives are}} part of our Organization'
                      }
                    />
                  </h1>
                  <div className="cardsList">
                    <CollectivesWithData
                      ParentCollectiveId={collective.id}
                      orderBy="balance"
                      orderDirection="DESC"
                      limit={20}
                    />
                  </div>
                </section>
              )}

              {get(collective, 'settings.superCollectiveTags') && (
                <section id="parenting">
                  <h1>
                    <FormattedMessage
                      id="organization.supercollective.title"
                      values={{
                        tags: get(collective, 'settings.superCollectiveTags').join(', '),
                        n: collective.stats.collectives.memberOf,
                      }}
                      defaultMessage={'{tags} Collectives'}
                    />
                  </h1>
                  <div className="cardsList">
                    <CollectivesWithData
                      tags={get(collective, 'settings.superCollectiveTags')}
                      orderBy="balance"
                      orderDirection="DESC"
                      limit={20}
                    />
                  </div>
                </section>
              )}

              {Object.keys(memberOfByRole).map(role => role !== 'HOST' && this.renderRole(role))}
            </div>
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default injectIntl(UserCollective);

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get } from 'lodash';
import withIntl from '../lib/withIntl';
import { Link } from '../server/pages';

import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import CollectiveCover from './CollectiveCover';
import TierCard from './TierCard';
import NotificationBar from './NotificationBar';
import MembersWithData from './MembersWithData';
import CollectivesWithData from './CollectivesWithData';
import SectionTitle from './SectionTitle';
import TeamSection from './TeamSection';
import UpdatesSection from './UpdatesSection';
import ExpensesSection from '../apps/expenses/components/ExpensesSection';
import EventsSection from './EventsSection';
import LongDescription from './LongDescription';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Collective extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    query: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);

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
    window.oc = { collective: this.props.collective }; // for easy debugging
  }

  render() {
    const { intl, LoggedInUser, query, collective } = this.props;

    const donateParams = { collectiveSlug: collective.slug, verb: 'donate' };
    if (query.referral) {
      donateParams.referral = query.referral;
    }
    const backgroundImage = collective.backgroundImage || get(collective,'parentCollective.backgroundImage') || defaultBackgroundImage;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const notification = {};
    if (get(query, 'status') === 'collectiveCreated') {
      notification.title = intl.formatMessage(this.messages['collective.created']);
      notification.description = intl.formatMessage(this.messages['collective.created.description'], { host: collective.host.name });
    }

    return (
      <div className={`CollectivePage ${collective.type}`}>
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
              margin: 3rem 0 3rem 3rem;
            }
          }
        `}</style>

        <Header
          title={collective.name}
          description={collective.description || collective.longDescription}
          twitterHandle={collective.twitterHandle || get(collective.parentCollective, 'twitterHandle')}
          image={collective.image || get(collective.parentCollective, 'image') || backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          href={`/${collective.slug}`}
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
              collective={collective}
              cta={{ href: `#contribute`, label: 'contribute' }}
              LoggedInUser={LoggedInUser}
              />

            <div>
              <div>
                <div className="content" >

                  <div className="sidebar tiers" id="contribute">
                    { collective.tiers.map(tier => (
                      <TierCard
                        key={`TierCard-${tier.slug}`}
                        collective={collective}
                        tier={tier}
                        referral={query.referral}
                        />
                    ))}
                    <div className="CustomDonationTierCard">
                      <Link route={`/${collective.slug}/donate`}>
                        <a><FormattedMessage id="collective.tiers.donate" defaultMessage="Or make a one time donation" /></a>
                      </Link>
                    </div>
                  </div>

                  { (get(collective, 'stats.updates') > 0 || canEditCollective) &&
                    <UpdatesSection
                      LoggedInUser={LoggedInUser}
                      collective={collective}
                      />
                  }

                  { (get(collective, 'stats.events') > 0 || canEditCollective) &&
                    <EventsSection
                      LoggedInUser={LoggedInUser}
                      collective={collective}
                      />
                  }
                  <LongDescription longDescription={collective.longDescription} defaultSubtitle={collective.description} />

                  <TeamSection
                    collective={collective}
                    LoggedInUser={LoggedInUser}
                    limit={10}
                    />
                </div>
              </div>

              { get(collective, 'stats.collectives.memberOf') > 0 &&
                <section id="members" className="clear">
                  <div className="content" >
                    <SectionTitle
                      title={<FormattedMessage
                        id="collective.collective.memberOf.collective.parent.title"
                        defaultMessage={`Member collectives`}
                        />}
                      subtitle={(<FormattedMessage
                        id="collective.collective.memberOf.collective.parent.subtitle"
                        values={{ n: collective.stats.collectives.memberOf }}
                        defaultMessage={`{n, plural, one {this collective is} other {{n} collectives are}} part of our collective`}
                        />)}
                      />

                    <div className="cardsList">
                      <CollectivesWithData
                        ParentCollectiveId={collective.id}
                        orderBy="balance"
                        type="COLLECTIVE"
                        orderDirection="DESC"
                        limit={20}
                        />
                    </div>
                  </div>
                </section>
              }

              <ExpensesSection
                collective={collective}
                LoggedInUser={LoggedInUser}
                limit={10}
                />

              <section id="contributors" className="tier">
                <div className="content" >
                  { get(collective, 'stats.backers.all') === 0 &&
                  <SectionTitle
                    section="contributors"
                    subtitle={<FormattedMessage id="collective.section.contributors.empty" defaultMessage="You don't have any contributors yet." />}
                    />
                }
                  { get(collective, 'stats.backers.all') > 0 &&
                  <div>
                    <SectionTitle
                      section="contributors"
                      values={get(collective, 'stats.backers')}
                      />

                    <MembersWithData
                      collective={collective}
                      type="ORGANIZATION"
                      LoggedInUser={LoggedInUser}
                      role="BACKER"
                      limit={100}
                      />

                    <MembersWithData
                      collective={collective}
                      LoggedInUser={LoggedInUser}
                      type="USER"
                      role="BACKER"
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

export default withIntl(Collective);

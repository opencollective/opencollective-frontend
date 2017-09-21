import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import Memberships from '../components/Memberships';
import Markdown from 'react-markdown';
import withIntl from '../lib/withIntl';
import { defineMessages } from 'react-intl';
import { get, groupBy } from 'lodash';
import HashLink from 'react-scrollchor';
import MenuBar from './MenuBar';
import MessageModal from './MessageModal';

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
      'organization.collective.since': { id: 'organization.collective.since', defaultMessage: `Contributing since {year}`},
      'user.collective.since': { id: 'user.collective.since', defaultMessage: `Contributing since {year}`},
      'organization.collective.edit': { id: 'organization.collective.edit', defaultMessage: `EDIT ORGANIZATION`},
      'user.collective.edit': { id: 'user.collective.edit', defaultMessage: `EDIT PROFILE`},
      'user.collective.memberOf.host.title': { id: 'user.collective.memberOf.host.title', defaultMessage: `I'm hosting {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.admin.title': { id: 'user.collective.memberOf.admin.title', defaultMessage: `I'm a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.member.title': { id: 'user.collective.memberOf.member.title', defaultMessage: `I'm a member of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.backer.title': { id: 'user.collective.memberOf.backer.title', defaultMessage: `I'm backing {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.follower.title': { id: 'user.collective.memberOf.follower.title', defaultMessage: `I'm following {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.contributor.title': { id: 'user.collective.memberOf.contributor.title', defaultMessage: `I'm contributing to {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.host.title': { id: 'organization.collective.memberOf.host.title', defaultMessage: `We are hosting {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.admin.title': { id: 'organization.collective.memberOf.admin.title', defaultMessage: `We are a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.member.title': { id: 'organization.collective.memberOf.member.title', defaultMessage: `We are a member of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.backer.title': { id: 'organization.collective.memberOf.backer.title', defaultMessage: `We are backing {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.follower.title': { id: 'organization.collective.memberOf.follower.title', defaultMessage: `We are following {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.menu.host': { id: 'user.collective.menu.host', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.admin': { id: 'user.collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.member': { id: 'user.collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.backer': { id: 'user.collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.contributor': { id: 'user.collective.menu.contributor', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.follower': { id: 'user.collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    })

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  render() {

    const { intl, LoggedInUser } = this.props;

    const type = this.collective.type.toLowerCase();

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

    if (LoggedInUser && LoggedInUser.canEditCollective) {
      actions.push({
        className: 'whiteblue small',
        component: <a href={`/${this.collective.slug}/edit`}>{intl.formatMessage(this.messages[`${type}.collective.edit`])}</a>
      });
    }

    return (
      <div className="UserCollectivePage">

        <style>{`
          h1 {
            font-size: 2rem;
          }
        `}</style>

        <Header
          title={this.collective.name}
          description={this.collective.description || this.collective.longDescription}
          twitterHandle={this.collective.twitterHandle || get(this.collective.parentCollective, 'twitterHandle')}
          image={get(this.collective.parentCollective, 'image')}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          href={`/${this.collective.slug}`}
          />

        <Body>

          <div>

            <NotificationBar status={this.state.status} error={this.state.error} />

            { this.props.message && <MessageModal message={this.props.message} /> }

            <CollectiveCover
              collective={this.collective}
              />

            <MenuBar
              info={intl.formatMessage(this.messages[`${type}.collective.since`], { year: (new Date(this.collective.createdAt)).getFullYear() })}
              actions={actions}
              />

            <div>

              <div className="content" >
                { this.collective.longDescription &&
                  <div className="collectiveDescription" >
                    <Markdown source={this.collective.longDescription} />
                  </div>
                }

                <div id="tiers">
                  <style jsx>{`
                    #tiers {
                      overflow: hidden
                      width: 100%;
                      display: flex;
                    }
                    #tiers :global(.tier) {
                      margin: 4rem auto;
                      max-width: 300px;
                      float: left;
                    }
                  `}</style>
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
              { Object.keys(memberOf).map(role => (
                <section id={role}>
                    <h1>{intl.formatMessage(this.messages[`${type}.collective.memberOf.${role.toLowerCase()}.title`], { n: memberOf[role].length })}</h1> 
                    <Memberships className={role} memberships={memberOf[role]} />
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

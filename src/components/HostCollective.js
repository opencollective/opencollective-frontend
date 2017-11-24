import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import CollectivesWithData from '../components/CollectivesWithData';
import Markdown from 'react-markdown';
import { defineMessages, FormattedMessage } from 'react-intl';
import { get, groupBy } from 'lodash';
import HashLink from 'react-scrollchor';
import MenuBar from './MenuBar';
import MessageModal from './MessageModal';
import { Button } from 'react-bootstrap';
import { Router, Link } from '../server/pages';

class HostCollective extends React.Component {

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
      'organization.collective.since': { id: 'organization.collective.since', defaultMessage: `Contributing Since {year}`},
      'user.collective.since': { id: 'user.collective.since', defaultMessage: `Contributing Since {year}`},
      'host.collective.since': { id: 'host.collective.since', defaultMessage: `Hosting Collectives Since {year}`},
      'organization.collective.edit': { id: 'organization.collective.edit', defaultMessage: `edit organization`},
      'user.collective.edit': { id: 'user.collective.edit', defaultMessage: `edit profile`},
      'user.collective.memberOf.host.title': { id: 'user.collective.memberOf.host.title', defaultMessage: `I'm hosting {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.admin.title': { id: 'user.collective.memberOf.admin.title', defaultMessage: `I'm a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.member.title': { id: 'user.collective.memberOf.member.title', defaultMessage: `I'm a member of {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.backer.title': { id: 'user.collective.memberOf.backer.title', defaultMessage: `I'm backing {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.memberOf.follower.title': { id: 'user.collective.memberOf.follower.title', defaultMessage: `I'm following {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.host.title': { id: 'organization.collective.memberOf.host.title', defaultMessage: `We are hosting {n, plural, one {this collective} other {{n} collectives}}`},
      'organization.collective.memberOf.admin.title': { id: 'organization.collective.memberOf.admin.title', defaultMessage: `We are a core contributor of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.member.title': { id: 'organization.collective.memberOf.member.title', defaultMessage: `We are a member of {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.backer.title': { id: 'organization.collective.memberOf.backer.title', defaultMessage: `We are backing {n, plural, one {this collective} other {these collectives}}`},
      'organization.collective.memberOf.follower.title': { id: 'organization.collective.memberOf.follower.title', defaultMessage: `We are following {n, plural, one {this collective} other {these collectives}}`},
      'user.collective.menu.host': { id: 'user.collective.menu.host', defaultMessage: `hosting {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.admin': { id: 'user.collective.menu.admin', defaultMessage: `contributing to {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.member': { id: 'user.collective.menu.member', defaultMessage: `member of {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.backer': { id: 'user.collective.menu.backer', defaultMessage: `backing {n} {n, plural, one {collective} other {collectives}}`},
      'user.collective.menu.follower': { id: 'user.collective.menu.follower', defaultMessage: `following {n} {n, plural, one {collective} other {collectives}}`},
    })

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  render() {
    let collectiveCreated = {};
    const { intl, LoggedInUser, query } = this.props;

    const type = this.collective.type.toLowerCase();
    let cta;
    if (this.collective.canApply) {
      cta = <a href={`/${this.collective.slug}/apply`}><FormattedMessage id="host.apply" defaultMessage="Apply to create a collective" /></a>
    }
    const actions = [];
    actions.push(
      {
        className: 'whiteblue',
        component: <HashLink to={`#hosting`}>{intl.formatMessage(this.messages[`user.collective.menu.host`], { n: this.collective.stats.collectives })}</HashLink>
      }
    );

    if (LoggedInUser && LoggedInUser.canEditCollective(this.collective)) {
      actions.push({
        className: 'whiteblue small allcaps',
        component: <Link route={`/${this.collective.slug}/edit`}><a>{intl.formatMessage(this.messages[`${type}.collective.edit`])}</a></Link>
      });
    }

    return (
      <div className="HostCollectivePage">

        <style>{`
          h1 {
            font-size: 2rem;
          }
          .message {
            text-align: center;
          }
          .message .thankyou {
            font-weight: bold;
          }
          .message .editBtn {
            margin: 2rem;
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

            <NotificationBar status={this.state.status} error={this.state.error} />

            { this.props.message && <MessageModal message={this.props.message} /> }

            <CollectiveCover
              collective={this.collective}
              cta={cta}
              />

            <MenuBar
              info={intl.formatMessage(this.messages[`${this.collective.isHost ? 'host' : type}.collective.since`], { year: (new Date(this.collective.createdAt)).getFullYear() })}
              actions={actions}
              />

            <div>

              <div className="content" >
                <div className="message">
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
                  { this.collective.longDescription &&
                    <div className="collectiveDescription" >
                      <Markdown source={this.collective.longDescription} />
                    </div>
                  }
                </div>
              </div>

              { this.collective.stats.collectives > 0 &&
                <section id="hosting">
                  <h1>
                    {intl.formatMessage(this.messages[`${type}.collective.memberOf.host.title`], { n: this.collective.stats.collectives })}
                  </h1>
                  { LoggedInUser && LoggedInUser.canEditCollective(this.collective) &&
                    <div className="adminActions" id="adminActions">
                      <ul>
                        <li><Link><a href={`/${this.collective.slug}/collectives/expenses`}><FormattedMessage id="host.collectives.manage" defaultMessage="Manage expenses" /></a></Link></li>
                      </ul>
                    </div>
                  }

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
            </div>
          </div>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(HostCollective);

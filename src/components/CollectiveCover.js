import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { union, get, uniqBy } from 'lodash';
import { prettyUrl, formatCurrency, imagePreview } from '../lib/utils';
import { Router } from '../server/pages';
import Currency from './Currency';
import Avatar from './Avatar';
import Logo from './Logo';
import { defaultBackgroundImage } from '../constants/collectives';
import Link from './Link';
import Button from './Button';
import GoalsCover from './GoalsCover';
import MenuBar from './MenuBar';
import TopBackersCoverWithData from './TopBackersCoverWithData';

class CollectiveCover extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    href: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    style: PropTypes.object,
    cta: PropTypes.object // { href, label }
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'contribute': { id: 'collective.contribute', defaultMessage: 'contribute' },
      'apply': { id: 'host.apply.btn', defaultMessage: "Apply to create a collective" },
      'ADMIN': { id: 'roles.admin.label', defaultMessage: 'Core Contributor' },
      'MEMBER': { id: 'roles.member.label', defaultMessage: 'Contributor' }
    });

    if (props.cta) {
      const label = props.cta.label;
      this.cta = { href: props.cta.href, label: this.messages[label] ? props.intl.formatMessage(this.messages[label]) : label };
    }
  }

  getMemberTooltip(member) {
    const { intl } = this.props;
    let tooltip = member.member.name;
    if (this.messages[member.role]) {
      tooltip += `
${intl.formatMessage(this.messages[member.role])}`;
    }
    const description = member.description || member.member.description;
    if (description) {
      tooltip += `
${description}`
    }
    return tooltip;
  }

  render() {
    const {
      collective,
      className,
      LoggedInUser
    } = this.props;

    const {
      company,
      type,
      website,
      twitterHandle,
      stats
    } = collective;

    const href = this.props.href || collective.path || `/${collective.slug}`;
    const title = this.props.title || collective.name;
    const description = this.props.description || collective.description;
    const formattedYearlyIncome = stats && stats.yearlyBudget > 0 && formatCurrency(stats.yearlyBudget, collective.currency, { precision: 0 });
    const backgroundImage = imagePreview(collective.backgroundImage || get(collective,'parentCollective.backgroundImage'), defaultBackgroundImage[collective.type], { height: 500 });
    const customStyles = get(collective, 'settings.style.hero.cover') || get(collective.parentCollective, 'settings.style.hero.cover');
    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      ...customStyles
    };

    const logo = collective.image || get(collective.parentCollective, 'image');

    let membersPreview = [];
    if (collective.members) {
      const admins = collective.members.filter(m => m.role === 'ADMIN');
      const members = collective.members.filter(m => m.role === 'MEMBER');
      const backers = collective.members.filter(m => m.role === 'BACKER');
      backers.sort((a, b) => b.stats && b.stats.totalDonations - a.stats && a.stats.totalDonations);
      membersPreview = uniqBy(union(admins, members, backers).filter(m => m.member), m => m.member.id).slice(0, 5);
    }
    const additionalBackers = (get(stats, 'backers.all') || (get(collective, 'members') || []).length) - membersPreview.length;

    return (
      <div className={`CollectiveCover ${className} ${type}`}>
        <style jsx>{`
        .cover {
          align-items: center;
          position: relative;
          text-align: center;
          min-height: 400px;
          width: 100%;
          overflow: hidden;
        }
        .small .cover {
          height: 22rem;
          min-height: 22rem;
        }
        .small .description, .small .contact, .small .stats, .small .members {
          display: none;
        }
        .backgroundCover {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        .twitterHandle {
          background: url('/static/icons/twitter-handler.svg') no-repeat 0px 6px;
          padding-left: 22px;
        }
        .website {
          background: url('/static/icons/external-link.svg') no-repeat 0px 6px;
          padding-left: 22px;
        }
        .host label {
          font-weight: 300;
          margin-right: 5px;
          opacity: 0.75;
        }
        .content {
          z-index: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          color: black;
          margin-top: 70px;
        }
        .small .content {
          margin-top: 0px;
        }
        .content, .content a {
          color: white;
        }
        .content a:hover {
          color: #444;
        }
        .USER .cover {
          display: block;
        }
        .COLLECTIVE .content {
          margin-top: 0px;
        }
        .logo {
          max-width: 20rem;
          max-height: 10rem;
          margin: 2rem auto;
          display: block;
        }
        .USER .logo {
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px #75cc1f;
          border-radius: 50%;
          margin: 3rem auto;
        }
        .USER.small .logo {
          margin: 2rem auto;
        }
        h1 {
          font-size: 3rem;
          margin: 1.5rem;
        }
        .contact {
          display: flex;
          flex-direction: row;
          justify-content: center;
          flex-wrap: wrap;
        }
        .contact div {
          margin: 1rem;
        }
        .members {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
        }
        .members a {
          margin: 0.3rem;
        }
        .avatar {
          float: left;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin: 0 0.5rem;
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #75cc1f;
        }
        .MoreBackers {
          font-size: 2rem;
          line-height: 36px;
          margin-left: 1rem;
        }
        .statsContainer {
          position: relative;
          margin-top: 3rem;
          padding: 3rem 1rem;
          z-index: 1;
          background-color: #252729;
        }
        .topContributors {
          margin-top: -6rem;
        }
        .stats {
          font-size: 1.3rem;
          display: flex;
          justify-content: center;
          color: white;
        }
        .stats .value {
          font-size: 3rem;
        }
        .stat {
          margin: 1rem;
        }
        .counter {
          margin: 1rem 0px;
        }
        .counter .-character {
          font-family: Lato;
          font-size: 22px;
          font-weight: bold;
          margin: 1px;
        }
        .counter .-digit {
          display: inline-block;
          width: 20px;
          height: 28px;
          border-radius: 3px;
          background-color: rgba(0, 0, 0, 0.6);
          border: solid 1px #000000;
          font-family: Lato;
          font-size: 22px;
          color: #ffffff;
          font-weight: bold;
          line-height: 1.25;
          margin: 1px;
        }
        @media(max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }
        }
        `}</style>
        <style jsx global>{`
        .CollectiveCover .content a {
          color: white;
        }
        `}</style>
        <div className="cover">
          <div className="backgroundCover" style={style} />

          <div className="content">
            <Link route={href} className="goBack">
              { collective.type === 'USER' && <Avatar src={logo} className="logo" radius="10rem" /> }
              { collective.type !== 'USER' && <Logo src={logo} className="logo" type={collective.type} website={collective.website} height="10rem" /> }
            </Link>
            <h1>{title}</h1>
            { company && company.substr(0,1) === '@' && <p className="company"><Link route={`/${company.substr(1)}`}>{company.substr(1)}</Link></p> }
            { company && company.substr(0,1) !== '@' && <p className="company">{company}</p> }
            { description && <p className="description">{description}</p> }
            { collective.type !== 'EVENT' &&
              <div className="contact">
                { collective.host && collective.isActive && <div className="host"><label><FormattedMessage id="collective.cover.hostedBy" defaultMessage="Hosted by" /></label><Link route={`/${collective.host.slug}`}>{collective.host.name} </Link></div> }
                { collective.host && !collective.isActive && <div className="host"><label><FormattedMessage id="collective.cover.pendingApprovalFrom" defaultMessage="Pending approval from" /></label><Link route={`/${collective.host.slug}`}>{collective.host.name} </Link></div> }
                { twitterHandle && <div className="twitterHandle"><a href={`https://twitter.com/${twitterHandle}`} target="_blank">@{twitterHandle}</a></div> }
                { website && <div className="website"><a href={website} target="_blank">{prettyUrl(website) }</a></div> }
              </div>
            }
            { collective.type === 'EVENT' &&
              <div className="contact">
                <div className="parentCollective">
                  <Link route={`/${collective.parentCollective.slug}`}>{collective.parentCollective.name}</Link>
                </div>
              </div>
            }

          </div>

          <div className="statsContainer">

            { className !== "small" && collective.type === "COLLECTIVE" &&
              <div className="topContributors">
                <TopBackersCoverWithData
                  collective={this.props.collective}
                  LoggedInUser={LoggedInUser}
                  limit={5}
                  />
              </div>
            }

            { ['USER','ORGANIZATION'].indexOf(collective.type) !== -1 && stats && stats.totalAmountSent > 0 && !collective.isHost &&
              <div className="stats">
                <div className="stat">
                  <div className="totalAmountSent value">
                    <Currency value={stats.totalAmountSent} currency={collective.currency} />
                  </div>
                  <FormattedMessage id="collective.stats.totalAmountSent.label" defaultMessage="Total amount donated" />
                </div>
                { stats.totalAmountRaised > 0 &&
                  <div className="stat">
                    <div className="totalAmountRaised value">
                      <Currency value={stats.totalAmountRaised} currency={collective.currency} />
                    </div>
                    <FormattedMessage id="collective.stats.totalAmountRaised.label" defaultMessage="Total amount raised" />
                  </div>
                }
              </div>
            }

            { className !== "small" && collective.type === "COLLECTIVE" &&
              <GoalsCover
                collective={collective}
                LoggedInUser={LoggedInUser}
                />
            }

            { this.props.cta &&
              <Button className="blue" href={this.cta.href}>{this.cta.label}</Button>
            }
          </div>
        </div>

        { className !== "small" &&
          <MenuBar
            collective={collective}
            LoggedInUser={LoggedInUser}
            cta={this.cta}
            />
        }

      </div>
    );
  }
}

export default withIntl(CollectiveCover);

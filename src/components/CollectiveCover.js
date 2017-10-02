import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Link } from '../server/pages';
import { union, get } from 'lodash';
import { prettyUrl, formatCurrency } from '../lib/utils';
import { Router } from '../server/pages';
import Currency from './Currency';
import Avatar from './Avatar';
import Logo from './Logo';
import { defaultBackgroundImage } from '../constants/collectives';
import CTAButton from './Button';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';

class CollectiveCover extends React.Component {

  static propTypes = {
    href: PropTypes.string,
    cta: PropTypes.node,
    title: PropTypes.string,
    style: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'ADMIN': { id: 'roles.admin.label', defaultMessage: 'Core Contributor' },
      'CONTRIBUTOR': { id: 'roles.contributor.label', defaultMessage: 'Contributor' }
    });
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
      title,
      href
    } = this.props;

    const {
      description,
      type,
      website,
      twitterHandle,
      stats
    } = collective;

    const formattedYearlyIncome = stats && stats.yearlyBudget > 0 && formatCurrency(stats.yearlyBudget, collective.currency);
    const backgroundImage = collective.backgroundImage || get(collective,'parentCollective.backgroundImage') || defaultBackgroundImage[collective.type];
    const customStyles = get(collective, 'settings.style.hero.cover') || get(collective.parentCollective, 'settings.style.hero.cover');
    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundPosition: collective.type === 'COLLECTIVE' ? 'center center' : 'center -40px',
      backgroundSize: 'cover',
      ...customStyles
    };

    const logo = collective.image || get(collective.parentCollective, 'image');

    let membersPreview = [];
    if (collective.members) {
      const admins = collective.members.filter(m => m.role === 'ADMIN');
      const members = collective.members.filter(m => m.role === 'MEMBER');
      const contributors = collective.members.filter(m => m.role === 'CONTRIBUTOR');
      const backers = collective.members.filter(m => m.role === 'BACKER');
      backers.sort((a, b) => b.totalDonations - a.totalDonations);
      membersPreview = union(admins, members, contributors, backers).slice(0, 5);
    }

    return (
      <div className={`CollectiveCover ${className} ${type}`}>
        <style jsx global>{`
          .CollectiveCover .ctabtn a {
            color: white !important;
          }
        `}</style>
        <style jsx>{`
        .cover {
          display: flex;
          align-items: center;
          position: relative;
          text-align: center;
          min-height: 400px;
          width: 100%;
          overflow: hidden;
        }
        .small .cover {
          height: 200px;
          min-height: 200px;
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
        }
        .content {
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
        .content a {
          color: black;
        }
        .USER .cover {
          display: block;
        }
        .COLLECTIVE .content {
          margin-top: 0px;
        }
        .COLLECTIVE .content, .COLLECTIVE .content a {
          color: white;
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
          margin: 0;
        }
        .contact {
          display: flex;
          flex-direction: row;
          justify-content: center
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
        .stats {
          font-size: 1.3rem;
        }
        .stats .value {
          font-size: 3rem;
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
        .CollectiveCover :global(.ctabtn) {
          margin: 2rem 0 0 0;
          width: 25rem;
          font-family: Lato;
          text-transform: uppercase;
          background-color: #75cc1f;
          font-size: 1.6rem;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white !important;
          border-radius: 2.8rem;
        }
        @media(max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }
        }
        `}</style>
        <div className="cover">
          <div className="backgroundCover" style={style} />
          <div className="content">
            <Link route={href}><a>
              { collective.type === 'USER' && <Avatar src={logo} className="logo" radius="10rem" /> }
              { collective.type !== 'USER' && <Logo src={logo} className="logo" height="10rem" /> }
            </a></Link>
            <h1>{title}</h1>
            { description && <p className="description">{description}</p> }
            { (twitterHandle || website) &&
              <div className="contact">
                { twitterHandle && <div className="twitterHandle"><a href={`https://twitter.com/${twitterHandle}`} target="_blank">@{twitterHandle}</a></div> }
                { website && <div className="website"><a href={website} target="_blank">{prettyUrl(website) }</a></div> }
              </div>
            }
            { membersPreview.length > 0 &&
              <div className="members">
                { membersPreview.map(member => (
                  <a onClick={() => Router.pushRoute(`/${member.member.slug}`)} title={this.getMemberTooltip(member)} key={member.member.slug}>
                    <Avatar src={member.member.image} key={member.member.id} radius={36} />
                  </a>
                ))}
                { membersPreview.length < collective.members.length &&
                  <div className="MoreBackers">
                    + {(stats.backers || collective.members.length) - membersPreview.length}
                  </div>
                }
              </div>
            }
            { collective.type === 'COLLECTIVE' && stats && stats.yearlyBudget > 0 &&
              <div className="stats">
                <div className="yearlyBudget value counter">
                  { formattedYearlyIncome.split('').map((character) => <span className={/[^0-9]/.test(character) ? '-character' : '-digit'}>{character}</span>) }
                </div>
                <FormattedMessage id="collective.stats.yearlyBudget.label" defaultMessage="Estimated annual budget based on current donations" />
              </div>
            }
            { ['USER','ORGANIZATION'].indexOf(collective.type) !== -1 && stats && stats.totalAmountSent > 0 &&
              <div className="stats">
                <div className="totalAmountSent value">
                  <Currency value={stats.totalAmountSent} currency={collective.currency} />
                </div>
                <FormattedMessage id="collective.stats.totalAmountSent.label" defaultMessage="Total amount donated" />
              </div>
            }
            { this.props.cta &&
              <CTAButton className="ctabtn green">{this.props.cta}</CTAButton>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default withIntl(CollectiveCover);
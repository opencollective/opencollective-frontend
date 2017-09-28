import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import { Router } from '../server/pages';

import { defineMessages, injectIntl, FormattedMessage, FormattedDate } from 'react-intl';
import { formatCurrency, firstSentence, singular, capitalize } from '../lib/utils';
import CollectiveCard from './CollectiveCard';
import Currency from './Currency';
import Avatar from './Avatar';

class Member extends React.Component {

  static propTypes = {
    member: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    viewMode: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);

    this.messages = defineMessages({
      'membership.totalDonations': { id: 'membership.totalDonations', defaultMessage: 'Total amount contributed' }
    });
  }

  onClick() {
    Router.pushRoute(`/${this.props.member.member.slug}`);
  }

  render() {
    const { viewMode, collective, intl } = this.props;
    const membership = { ...this.props.member };
    membership.collective = collective;
    const { member, description } = membership;

    const user = member.user || {};
    const name = ((member.name && member.name.match(/^null/)) ? null : member.name) || member.slug || user.email && user.email.substr(0, user.email.indexOf('@'));

    if (!name) return (<div/>);

    const className = this.props.className;
    let title = member.name;
    if (member.description) {
      title += `
${member.description}`;
    }
    if (className.match(/small/)) {
      title += `

${intl.formatMessage(this.messages['membership.totalDonations'])}: ${formatCurrency(membership.totalDonations, collective.currency)}`
    }

    const tierName = membership.tier ? singular(membership.tier.name) : membership.role;
    return (
      <div className={`Member ${className} ${member.type} viewMode-${viewMode}`}>
        <style jsx>{`
        .Member {
          width: 100%;
          margin: 1rem;
          max-width: 300px;
          float: left;
          position: relative;
        }

        .Member.small {
          width: 48px;
          margin: 0.5rem 0.25rem;
        }

        .Member.viewMode-ORGANIZATION {
          width: 200px;
        }

        .Member :global(.Avatar) {
          float: left;
          width: 45px;
          height: 45px;
          margin-top: 1rem;
        }

        .bubble {
          padding: 1rem;
          text-align: left;
          overflow: hidden;
        }

        .small .avatar {
          margin: 0;
        }

        .small .bubble {
          display: none;
        }

        .name {
          font-family: 'montserratlight';
          font-size: 1.7rem;
        }

        .description, .meta {
          font-family: 'lato';
          font-size: 1.4rem;
        }

        `}</style>          
        <div>
          { viewMode === 'USER' &&
            <a onClick={this.onClick} title={title}>
              <Avatar src={member.image} radius={45} />
              <div className="bubble">
                <div className="name">{name}</div>
                <div className="description" style={{color: colors.darkgray}}>{firstSentence(description || member.description, 64)}</div>
                <div className="meta since" style={{color: colors.darkgray}}>
                  {tierName && capitalize(tierName)} &nbsp;
                  <FormattedMessage id='membership.since' defaultMessage={`since`} />&nbsp;
                  <FormattedDate value={membership.createdAt} month='long' year='numeric' />
                </div>
                { membership.totalDonations > 0 &&
                  <div className="meta totalDonations" style={{color: colors.darkgray}}>
                    <FormattedMessage id='membership.totalDonations' defaultMessage={`Total amount contributed`} />
                    <span>: </span>
                    <Currency value={membership.totalDonations} currency={collective.currency} />
                  </div>
                }
              </div>
            </a>
          }
          { viewMode === 'ORGANIZATION' &&
            <CollectiveCard collective={member} membership={membership} />
          }
        </div>
      </div>
    )
  }

}

export default injectIntl(Member);
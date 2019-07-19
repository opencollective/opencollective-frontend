import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { Flex } from '@rebass/grid';

import colors from '../constants/colors';
import { formatCurrency, formatDate, firstSentence, singular, capitalize } from '../lib/utils';
import LinkCollective from './LinkCollective';
import CollectiveCard from './CollectiveCard';
import Avatar from './Avatar';

class Member extends React.Component {
  static propTypes = {
    member: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    viewMode: PropTypes.string,
    intl: PropTypes.object.isRequired,
    className: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'membership.since': { id: 'membership.since', defaultMessage: 'since {date}' },
      ADMIN: { id: 'roles.admin.label', defaultMessage: 'Admin' },
      MEMBER: { id: 'roles.member.label', defaultMessage: 'Contributor' },
      BACKER: { id: 'roles.backer.label', defaultMessage: 'Backer' },
      'membership.totalDonations': {
        id: 'membership.totalDonations',
        defaultMessage: 'Total amount contributed',
      },
    });
  }

  render() {
    const { collective, intl } = this.props;
    const membership = { ...this.props.member };
    membership.collective = collective;
    const { member, description } = membership;
    const viewMode = this.props.viewMode || (get(member, 'type') === 'USER' ? 'USER' : 'ORGANIZATION');
    const user = member.user || {};
    const name =
      (member.name && member.name.match(/^null/) ? null : member.name) ||
      member.slug ||
      (user.email && user.email.substr(0, user.email.indexOf('@')));
    if (!name) return <div />;

    const tierName = membership.tier
      ? singular(membership.tier.name)
      : this.messages[membership.role]
      ? intl.formatMessage(this.messages[membership.role])
      : membership.role;
    let memberSinceStr = '';
    if (tierName) {
      memberSinceStr += capitalize(tierName);
    }
    memberSinceStr += ` ${intl.formatMessage(this.messages['membership.since'], {
      date: formatDate(membership.createdAt),
      tierName: tierName ? capitalize(tierName) : '',
    })}`;
    const className = this.props.className || '';
    const totalDonationsStr = membership.stats
      ? `${intl.formatMessage(this.messages['membership.totalDonations'])}: ${formatCurrency(
          membership.stats.totalDonations,
          collective.currency,
          { precision: 0 },
        )}`
      : '';
    let title = member.name;
    if (member.company) {
      title += `
${member.company}`;
    }
    if (member.description) {
      title += `
${member.description}`;
    }
    if (className.match(/small/)) {
      title += `

${memberSinceStr}
${totalDonationsStr}`;
    }

    return (
      <div className={`Member ${className} ${member.type} viewMode-${viewMode}`}>
        <style jsx>
          {`
            .Member {
              width: 100%;
              max-width: 300px;
              float: left;
              position: relative;
            }

            .Member.small {
              width: 48px;
            }

            .Member.viewMode-ORGANIZATION {
              width: 200px;
              margin: 1rem;
            }

            .bubble {
              padding: 1rem;
              padding-top: 0;
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
              font-size: 1.7rem;
            }

            .description,
            .meta {
              font-size: 1.4rem;
            }
          `}
        </style>
        <div>
          {viewMode === 'USER' && (
            <LinkCollective collective={this.props.member.member} target="_top" title={title}>
              <Flex mt={2}>
                <Avatar collective={member} radius={45} className="noFrame" />
                <div className="bubble">
                  <div className="name">{name}</div>
                  <div className="description" style={{ color: colors.darkgray }}>
                    {firstSentence(description || member.description, 64)}
                  </div>
                  <div className="meta since" style={{ color: colors.darkgray }}>
                    {memberSinceStr}
                  </div>
                  {totalDonationsStr && (
                    <div className="meta totalDonations" style={{ color: colors.darkgray }}>
                      {totalDonationsStr}
                    </div>
                  )}
                </div>
              </Flex>
            </LinkCollective>
          )}
          {viewMode === 'ORGANIZATION' && <CollectiveCard collective={member} membership={membership} />}
        </div>
      </div>
    );
  }
}

export default injectIntl(Member);

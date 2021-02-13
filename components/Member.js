import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../lib/currency-utils';
import { capitalize, firstSentence, formatDate, singular } from '../lib/utils';

import Avatar from './Avatar';
import CollectiveCard from './CollectiveCard';
import Container from './Container';
import { Flex } from './Grid';
import LinkCollective from './LinkCollective';

const MemberContainer = styled.div`
  max-width: 300px;
  float: left;
  position: relative;

  .USER {
    margin: 0.5rem 0.25rem;
  }

  .small {
    width: 48px;
  }

  .small .avatar {
    margin: 0;
  }

  .ORGANIZATION,
  .COLLECTIVE {
    width: 200px;
    margin: 1rem;
  }
`;

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
      ADMIN: { id: 'Member.Role.ADMIN', defaultMessage: 'Admin' },
      MEMBER: { id: 'Member.Role.MEMBER', defaultMessage: 'Core Contributor' },
      BACKER: { id: 'Member.Role.BACKER', defaultMessage: 'Financial Contributor' },
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
    if (!name) {
      return <div />;
    }

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
      <MemberContainer>
        <Container className={`${className} ${member.type} viewMode-${viewMode}`}>
          {viewMode === 'USER' && (
            <LinkCollective collective={this.props.member.member} target="_top" title={title}>
              <Flex mt={2}>
                <Avatar collective={member} radius={45} className="noFrame" />
                <Container padding="1rem" paddingTop="0" textAlign="left" overflow="hidden" display="none">
                  <Container fontSize="1.7rem">{name}</Container>
                  <Container fontSize="1.4rem" style={{ color: props => props.theme.colors.darkgray }}>
                    {firstSentence(description || member.description, 64)}
                  </Container>
                  <Container
                    className="since"
                    fontSize="1.4rem"
                    style={{ color: props => props.theme.colors.darkgray }}
                  >
                    {memberSinceStr}
                  </Container>
                  {totalDonationsStr && (
                    <Container
                      className="totalDonations"
                      fontSize="1.4rem"
                      style={{ color: props => props.theme.colors.darkgray }}
                    >
                      {totalDonationsStr}
                    </Container>
                  )}
                </Container>
              </Flex>
            </LinkCollective>
          )}
          {viewMode === 'ORGANIZATION' && <CollectiveCard collective={member} membership={membership} />}
        </Container>
      </MemberContainer>
    );
  }
}

export default injectIntl(Member);

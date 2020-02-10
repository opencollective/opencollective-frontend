import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@rebass/grid';
import { width } from 'styled-system';
import { FormattedMessage, FormattedDate, injectIntl, defineMessages } from 'react-intl';
import Currency from './Currency';
import Link from './Link';
import Logo from './Logo';
import { get } from 'lodash';
import { firstSentence, imagePreview } from '../lib/utils';
import { defaultBackgroundImage } from '../lib/constants/collectives';
import Container from './Container';
import StyledButton from './StyledButton';

const CardWrapper = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  vertical-align: top;
  position: relative;
  box-sizing: border-box;
  width: 215px;
  min-height: 380px;
  border-radius: 15px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(45, 77, 97, 0.2);
  overflow: hidden;
  text-decoration: none !important;
  ${width}
`;

const ApplyButton = styled(StyledButton)`
  font-weight: 500;
  font-size: ${props => props.theme.fontSizes.Caption}px;
  line-height: ${props => props.theme.lineHeights.Tiny};
  border-radius: 100px;
  width: 62px;
  background: linear-gradient(180deg, #1869f5 0%, #1659e1 100%);
  padding: 5px 14px;
`;

class CollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    membership: PropTypes.object,
    memberships: PropTypes.array,
    intl: PropTypes.object.isRequired,
    showApplyButton: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'membership.role.host': {
        id: 'Member.Role.HOST',
        defaultMessage: 'Host',
      },
      'roles.admin.label': {
        id: 'Member.Role.ADMIN',
        defaultMessage: 'Collective Admin',
      },
      'roles.member.label': {
        id: 'Member.Role.MEMBER',
        defaultMessage: 'Core Contributor',
      },
      'tier.name.sponsor': {
        id: 'tier.name.sponsor',
        defaultMessage: 'sponsor',
      },
      'tier.name.backer': {
        id: 'tier.name.backer',
        defaultMessage: 'backer',
      },
    });
  }

  render() {
    const { intl, collective, membership } = this.props;
    let { memberships } = this.props;
    memberships = memberships || (membership ? [membership] : []);

    const getTierName = membership => {
      const tierName = get(membership, 'tier.name');
      const role = get(membership, 'role');
      if (!tierName) {
        switch (role) {
          case 'HOST':
            return intl.formatMessage(this.messages['membership.role.host']);
          case 'ADMIN':
            return intl.formatMessage(this.messages['roles.admin.label']);
          case 'MEMBER':
            return intl.formatMessage(this.messages['roles.member.label']);
          default:
            if (collective.type === 'ORGANIZATION') {
              return intl.formatMessage(this.messages['tier.name.sponsor']);
            } else {
              return intl.formatMessage(this.messages['tier.name.backer']);
            }
        }
      }
      return tierName;
    };

    const membershipDates = memberships.map(m => m.createdAt);
    membershipDates.sort((a, b) => {
      return b - a;
    });

    const oldestMembershipDate = membershipDates.length ? membershipDates[0] : null;
    const roles = new Set(memberships.map(m => getTierName(m)));

    const coverStyle = {};
    const backgroundImage = imagePreview(
      collective.backgroundImage || get(collective, 'parentCollective.backgroundImage'),
      defaultBackgroundImage['COLLECTIVE'],
      { width: 400 },
    );

    if (!coverStyle.backgroundImage && backgroundImage) {
      coverStyle.backgroundImage = `url('${backgroundImage}')`;
      coverStyle.backgroundSize = 'cover';
      coverStyle.backgroundPosition = 'center center';
    }

    const truncatedDescription = collective.description && firstSentence(collective.description, 80);
    const description = collective.description;

    let route, params;
    if (collective.type === 'EVENT') {
      route = 'event';
      params = {
        parentCollectiveSlug: collective.parentCollective && collective.parentCollective.slug,
        eventSlug: collective.slug,
      };
    } else {
      route = 'collective';
      params = { slug: collective.slug };
    }

    return (
      <Link route={route} target="_top" params={params}>
        <CardWrapper className={`CollectiveCard ${collective.type}`} {...this.props}>
          <style jsx>
            {`
              .head {
                position: relative;
                overflow: hidden;
                width: 100%;
                height: 14rem;
                border-bottom: 5px solid #46b0ed;
              }

              .background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
              }

              .logo {
                display: flex;
                height: 100%;
                align-items: center;
                justify-content: center;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
              }

              .body {
                padding: 1rem;
                min-height: 11rem;
              }

              .name,
              .description {
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .name {
                min-height: 20px;
                font-size: 14px;
                margin: 5px;
                font-weight: 700;
                text-align: center;
                color: #303233;
                white-space: nowrap;
              }

              .description {
                font-weight: normal;
                text-align: center;
                color: #787d80;
                font-size: 1.2rem;
                line-height: 1.3;
                margin: 0 5px;
                min-height: 50px;
              }

              .footer {
                font-size: 1.1rem;
                width: 100%;
                min-height: 6rem;
                text-align: center;
              }

              .membership,
              .stats,
              .totalDonations {
                border-top: 1px solid #f2f2f2;
                padding: 1rem;
                color: #303233;
              }

              .stats {
                display: flex;
                width: 100%;
                box-sizing: border-box;
                justify-content: space-around;
              }

              .totalDonationsAmount {
                font-size: 2rem;
              }

              .role {
                min-height: 13px;
                font-weight: 700;
                letter-spacing: 3px;
                color: #75cc1f;
                text-transform: uppercase;
              }

              .comma-list {
                display: inline;
                list-style: none;
                padding: 0px;
              }

              .comma-list li {
                display: inline;
              }

              .comma-list li::after {
                content: ', ';
              }

              .comma-list li:last-child::after {
                content: '';
              }

              .value,
              .label {
                text-align: center;
                margin: auto;
              }

              .value {
                font-weight: normal;
                text-align: center;
                color: #303233;
                font-size: 1.4rem;
                margin: 3px 2px 0px;
              }

              .label {
                font-size: 9px;
                text-align: center;
                font-weight: 300;
                color: #a8afb3;
                text-transform: uppercase;
              }

              .since {
                min-height: 18px;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.5;
                text-align: center;
                color: #aab0b3;
                text-transform: capitalize;
              }
            `}
          </style>
          <div className="head">
            <div className="background" style={coverStyle} />
            <div className="logo">
              <Logo collective={collective} height={65} />
            </div>
          </div>
          <div className="body">
            <div className="name">{collective.name}</div>
            <div className="description" title={description}>
              {truncatedDescription}
            </div>

            {collective.isHost && this.props.showApplyButton && (
              <Box textAlign="center" my={3}>
                <Link route={`/${collective.slug}/apply`}>
                  <ApplyButton buttonStyle="primary" data-cy="host-apply-btn">
                    <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
                  </ApplyButton>
                </Link>
              </Box>
            )}
          </div>
          <div className="footer">
            {collective.type === 'COLLECTIVE' && get(collective, 'stats.backers.all') > 0 && (
              <div className="stats">
                <div className="backers">
                  <div className="value">{collective.stats.backers.all}</div>
                  <div className="label">
                    <FormattedMessage
                      id="collective.card.stats.backers"
                      defaultMessage="{n, plural, one {backer} other {backers}}"
                      values={{ n: collective.stats.backers.all }}
                    />
                  </div>
                </div>
                <div className="yearlyBudget">
                  <div className="value">
                    <Currency value={collective.stats.yearlyBudget} currency={collective.currency} />
                  </div>
                  <div className="label">
                    <FormattedMessage id="collective.card.stats.yearlyBudget" defaultMessage={'yearly budget'} />
                  </div>
                </div>
              </div>
            )}
            {collective.stats && collective.memberOf && collective.type === 'ORGANIZATION' && (
              <div className="stats">
                <div className="backers">
                  <div className="value">{collective.memberOf.length}</div>
                  <div className="label">
                    <FormattedMessage
                      id="collective.card.memberOf.count"
                      defaultMessage="{n, plural, one {collective} other {collectives}} backed"
                      values={{ n: collective.memberOf.length }}
                    />
                  </div>
                </div>
                <div className="yearlyBudget">
                  <div className="value">
                    <Currency value={collective.stats.totalAmountSpent} currency={collective.currency} />
                  </div>
                  <div className="label">
                    <FormattedMessage id="AmountContributed" defaultMessage="Contributed" />
                  </div>
                </div>
              </div>
            )}
            {collective.stats && collective.stats.collectives && (
              <div className="stats">
                <div className="backers">
                  <div className="value">{get(collective, 'stats.collectives.hosted')}</div>
                  <div className="label">
                    <FormattedMessage
                      id="collective.card.collectives.count"
                      defaultMessage="{n, plural, one {collective} other {collectives}} hosted"
                      values={{
                        n: get(collective, 'stats.collectives.hosted'),
                      }}
                    />
                  </div>
                </div>
                <div className="currency">
                  <div className="value">{collective.currency}</div>
                  <div className="label">
                    <FormattedMessage id="currency" defaultMessage="currency" />
                  </div>
                </div>
              </div>
            )}
            {roles && roles.size > 0 && (
              <div className="membership">
                <div className="role">
                  <ul className="comma-list">
                    {Array.from(roles).map(role => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                </div>
                {oldestMembershipDate && (
                  <div className="since">
                    <FormattedMessage
                      id="membership.since"
                      defaultMessage={'since {date}'}
                      values={{
                        date: <FormattedDate value={oldestMembershipDate} month="long" year="numeric" />,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {memberships.map(
              membership =>
                membership.role === 'BACKER' &&
                get(membership, 'stats.totalDonations') > 0 && (
                  <div className="totalDonations" key={membership.id}>
                    <div className="totalDonationsAmount">
                      <Currency
                        value={get(membership, 'stats.totalDonations')}
                        currency={get(membership, 'collective.currency')}
                      />
                    </div>
                    <FormattedMessage id="membership.totalDonations.title" defaultMessage={'Amount contributed'} />
                  </div>
                ),
            )}
          </div>
        </CardWrapper>
      </Link>
    );
  }
}

export default injectIntl(CollectiveCard);

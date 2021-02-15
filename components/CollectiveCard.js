import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, FormattedDate, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { width } from 'styled-system';

import { defaultBackgroundImage } from '../lib/constants/collectives';
import { imagePreview } from '../lib/image-utils';
import { firstSentence } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import Currency from './Currency';
import Link from './Link';

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

const NameWrapper = styled(Container)`
  min-height: 20px;
  font-size: 14px;
  margin: 5px;
  font-weight: 700;
  text-align: center;
  color: #303233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MembershipWrapper = styled(Container)`
  border-top: 1px solid #f2f2f2;
  padding: 1rem;
  color: #303233;
`;

const StatsWrapper = styled(MembershipWrapper)`
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: space-around;
`;

const ValueWrapper = styled(Container)`
  font-weight: normal;
  text-align: center;
  color: #303233;
  font-size: 1.4rem;
  margin: 3px 2px 0px;
  text-align: center;
  margin: auto;
`;

const LabelWrapper = styled(Container)`
  font-size: 9px;
  text-align: center;
  font-weight: 300;
  color: #a8afb3;
  text-transform: uppercase;
  text-align: center;
  margin: auto;
`;

const CommaList = styled.ul`
  display: inline;
  list-style: none;
  padding: 0px;

  li {
    display: inline;
  }

  li::after {
    content: ', ';
  }

  li:last-child::after {
    content: '';
  }
`;

class CollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    membership: PropTypes.object,
    memberships: PropTypes.array,
    intl: PropTypes.object.isRequired,
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
        defaultMessage: 'Admin',
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

    let route;
    if (collective.type === 'EVENT') {
      route = `/${collective.parentCollective?.slug || 'collective'}/events/${collective.slug}`;
    } else {
      route = `/${collective.slug}`;
    }

    return (
      <Link href={route} target="_top">
        <CardWrapper className={`CollectiveCard ${collective.type}`} {...this.props}>
          <Container position="relative" overflow="hidden" width="100%" height="14rem" borderBottom="5px solid #46b0ed">
            <Container
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              backgroundSize="cover"
              backgroundPosition="center"
              style={coverStyle}
            />
            <Container
              display="flex"
              height="100%"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              left="0"
              right="0"
              top="0"
              bottom="0"
            >
              <Avatar collective={collective} radius={65} />
            </Container>
          </Container>
          <Container padding="1rem" minHeight="11rem">
            <NameWrapper>{collective.name}</NameWrapper>
            <Container
              fontWeight="normal"
              textAlign="center"
              color="#787d80"
              fontSize="1.2rem"
              lineHeight="1.3"
              margin="0 5px"
              minHeight="50px"
              title={description}
            >
              {truncatedDescription}
            </Container>
          </Container>
          <Container fontSize="1.1rem" width="100%" minHeight="6rem" textAlign="center">
            {collective.type === 'COLLECTIVE' && get(collective, 'stats.backers.all') > 0 && (
              <StatsWrapper>
                <div className="backers">
                  <ValueWrapper>{collective.stats.backers.all}</ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage
                      id="collective.card.stats.backers"
                      defaultMessage="{n, plural, one {backer} other {backers}}"
                      values={{ n: collective.stats.backers.all }}
                    />
                  </LabelWrapper>
                </div>
                <div className="yearlyBudget">
                  <ValueWrapper>
                    <Currency value={collective.stats.yearlyBudget} currency={collective.currency} />
                  </ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage id="collective.card.stats.yearlyBudget" defaultMessage={'yearly budget'} />
                  </LabelWrapper>
                </div>
              </StatsWrapper>
            )}
            {collective.stats && collective.memberOf && collective.type === 'ORGANIZATION' && (
              <StatsWrapper>
                <div className="backers">
                  <ValueWrapper>{collective.memberOf.length}</ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage
                      id="collective.card.memberOf.count"
                      defaultMessage="Contributor to {n, plural, one {Collective} other {Collectives}}"
                      values={{ n: collective.memberOf.length }}
                    />
                  </LabelWrapper>
                </div>
                <div className="yearlyBudget">
                  <ValueWrapper>
                    <Currency value={collective.stats.totalAmountSpent} currency={collective.currency} />
                  </ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage id="AmountContributed" defaultMessage="Contributed" />
                  </LabelWrapper>
                </div>
              </StatsWrapper>
            )}
            {collective.stats && collective.stats.collectives && (
              <StatsWrapper>
                <div className="backers">
                  <ValueWrapper>{get(collective, 'stats.collectives.hosted')}</ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage
                      id="collective.card.collectives.count"
                      defaultMessage="Hosting {n, plural, one {Collective} other {Collectives}}"
                      values={{
                        n: get(collective, 'stats.collectives.hosted'),
                      }}
                    />
                  </LabelWrapper>
                </div>
                <div className="currency">
                  <ValueWrapper>{collective.currency}</ValueWrapper>
                  <LabelWrapper>
                    <FormattedMessage id="currency" defaultMessage="currency" />
                  </LabelWrapper>
                </div>
              </StatsWrapper>
            )}
            {roles && roles.size > 0 && (
              <MembershipWrapper>
                <Container
                  minHeight="13px"
                  fontWeight="700"
                  letterSpacing="3px"
                  color="#75cc1f"
                  textTransform="uppercase"
                >
                  <CommaList>
                    {Array.from(roles).map(role => (
                      <li key={role}>{role}</li>
                    ))}
                  </CommaList>
                </Container>
                {oldestMembershipDate && (
                  <Container
                    minHeight="18px"
                    fontSize="12px"
                    fontWeight="500"
                    lineHeight="1.5"
                    textAlign="center"
                    color="#aab0b3"
                    textTransform="capitalize"
                  >
                    <FormattedMessage
                      id="membership.since"
                      defaultMessage={'since {date}'}
                      values={{
                        date: <FormattedDate value={oldestMembershipDate} month="long" year="numeric" />,
                      }}
                    />
                  </Container>
                )}
              </MembershipWrapper>
            )}
            {memberships.map(
              membership =>
                membership.role === 'BACKER' &&
                get(membership, 'stats.totalDonations') > 0 && (
                  <MembershipWrapper key={membership.id}>
                    <Container fontSize="2rem">
                      <Currency
                        value={get(membership, 'stats.totalDonations')}
                        currency={get(membership, 'collective.currency')}
                      />
                    </Container>
                    <FormattedMessage id="membership.totalDonations.title" defaultMessage={'Amount contributed'} />
                  </MembershipWrapper>
                ),
            )}
          </Container>
        </CardWrapper>
      </Link>
    );
  }
}

export default injectIntl(CollectiveCard);

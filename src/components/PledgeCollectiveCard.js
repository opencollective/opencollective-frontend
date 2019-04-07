import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage, FormattedDate } from 'react-intl';
import styled from 'styled-components';
import { ExternalLinkAlt } from 'styled-icons/fa-solid/ExternalLinkAlt';

// import { defaultImage, defaultBackgroundImage } from '../constants/collectives';

// import { imagePreview } from '../lib/utils';

import { Flex, Box } from '@rebass/grid';
import Container from './Container';
import { P } from './Text';
import { Link } from '../server/pages';
import StyledLink from './StyledLink';
import { themeGet } from 'styled-system';
import Currency from './Currency';
const defaultPledgedLogo = '/static/images/default-collective-logo.svg';

const CollectiveLogoContainer = styled(Flex)`
  justify-content: center;
  border-top: 1px solid ${themeGet('colors.black.300')};
`;

class PledgeCollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      currency: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    LoggedInUser: PropTypes.object,
    membership: PropTypes.object,
  };

  render() {
    const { LoggedInUser, collective, membership } = this.props;

    let website = collective.website;
    if (!website && collective.githubHandle) {
      website = `https://github.com/${collective.githubHandle}`;
    }

    let tierName = get(membership, 'tier.name');
    const role = get(membership, 'role');
    if (!tierName) {
      switch (role) {
        case 'HOST':
          tierName = <FormattedMessage id="membership.role.host" defaultMessage="host" />;
          break;
        case 'ADMIN':
          tierName = <FormattedMessage id="roles.admin.label" defaultMessage="Core Contributor" />;
          break;
        case 'MEMBER':
          tierName = <FormattedMessage id="roles.member.label" defaultMessage="Contributor" />;
          break;
        default:
          tierName =
            collective.type === 'ORGANIZATION' ? (
              <FormattedMessage id="tier.name.sponsor" defaultMessage="sponsor" />
            ) : (
              <FormattedMessage id="tier.name.backer" defaultMessage="backer" />
            );
          break;
      }
    }
    let params;
    if (collective.type === 'EVENT') {
      params = {
        parentCollectiveSlug: collective.parentCollective && collective.parentCollective.slug,
        eventSlug: collective.slug,
      };
    } else {
      params = { slug: collective.slug };
    }

    if (LoggedInUser) {
      params.referral = LoggedInUser.CollectiveId;
    }

    return (
      <Container
        bg="white"
        borderRadius="8px"
        border="1px solid rgba(18,19,20,0.2)"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        minHeight="100%"
        overflow="hidden"
      >
        <div className="PledgeCollectiveCard">
          <style jsx>
            {`
              .footer {
                font-size: 1.1rem;
                width: 100%;
                min-height: 6rem;
                text-align: center;
              }

              .membership,
              .stats,
              .totalDonations,
              .totalRaised {
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

              .totalDonationsAmount,
              .totalRaisedAmount {
                font-size: 2rem;
              }

              .role {
                min-height: 13px;
                font-weight: 800;
                letter-spacing: 3px;
                color: #75cc1f;
                text-transform: uppercase;
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

          <CollectiveLogoContainer mt={52}>
            <Box mt={-50}>
              <Link route="collective" params={{ slug: collective.slug }}>
                <img src={defaultPledgedLogo} alt="Pledged Collective" radius={8} width="94px" mb={-43} />
              </Link>
            </Box>
          </CollectiveLogoContainer>

          <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mb={-1} color="black">
            <Link route="collective" params={{ slug: collective.slug }} color="black">
              {collective.name}
            </Link>
          </P>

          <P fontSize="1.2rem" textAlign="center" p={1}>
            <FormattedMessage id="Pledgecollective.card" defaultMessage="PLEDGED COLLECTIVES" />
          </P>
          <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
            <StyledLink href={website} color="primary.500" fontSize="Caption">
              <ExternalLinkAlt size="1em" /> {website}
            </StyledLink>
          </Link>
          <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
            <StyledLink buttonStyle="primary" mb={4} mx="auto" buttonSize="small">
              <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
            </StyledLink>
          </Link>
          <Link route="claimCollective" params={{ collectiveSlug: collective.slug }} passHref>
            <StyledLink textAlign="center" width={1} mb={4} buttonSize="small" buttonStyle="standard">
              <FormattedMessage id="pledge.claim" defaultMessage="Claim this collective" />
            </StyledLink>
          </Link>
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
                    <FormattedMessage id="collective.card.stats.totalAmountSpent" defaultMessage="contributed" />
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
            {membership && (
              <div className="membership">
                <div className="role">{tierName}</div>
                {membership.createdAt && (
                  <div className="since">
                    <FormattedMessage id="membership.since" defaultMessage={'since'} />
                    &nbsp;
                    <FormattedDate value={membership.createdAt} month="long" year="numeric" />
                  </div>
                )}
              </div>
            )}
            {role === 'BACKER' && get(membership, 'stats.totalDonations') > 0 && (
              <div className="totalDonations">
                <div className="totalDonationsAmount">
                  <Currency
                    value={get(membership, 'stats.totalDonations')}
                    currency={get(membership, 'collective.currency')}
                  />
                </div>
                <FormattedMessage id="membership.totalDonations.title" defaultMessage={'amount contributed'} />
              </div>
            )}
            {role === 'FUNDRAISER' && get(membership, 'stats.totalRaised') > 0 && (
              <div className="totalRaised">
                <div className="totalRaisedAmount">
                  <Currency
                    value={get(membership, 'stats.totalRaised')}
                    currency={get(membership, 'collective.currency')}
                  />
                </div>
                <FormattedMessage id="membership.totalRaised.title" defaultMessage={'amount raised'} />
              </div>
            )}
          </div>
        </div>
      </Container>
    );
  }
}

export default PledgeCollectiveCard;

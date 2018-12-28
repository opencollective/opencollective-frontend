import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import Currency from './Currency';
import Link from './Link';
import Logo from './Logo';
import { get } from 'lodash';
import { firstSentence, imagePreview } from '../lib/utils';
import { defaultBackgroundImage } from '../constants/collectives';

class CollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    membership: PropTypes.object,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { collective, membership, LoggedInUser } = this.props;

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

    const coverStyle =
      get(collective, 'settings.style.hero.cover') ||
      get(collective.parentCollective, 'settings.style.hero.cover') ||
      {};
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

    const truncatedDescription =
      (collective.description && firstSentence(collective.description, 80)) ||
      (collective.longDescription && firstSentence(collective.longDescription, 80));
    const description = collective.description;

    const route = collective.type === 'EVENT' ? collective.path : 'collective';

    const params = {
      slug: collective.slug,
    };
    if (LoggedInUser) {
      params.referral = LoggedInUser.CollectiveId;
    }

    return (
      <Link route={route} target="_top" params={params}>
        <div className={`CollectiveCard ${collective.type}`}>
          <style jsx>
            {`
              .CollectiveCard {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                cursor: pointer;
                vertical-align: top;
                position: relative;
                box-sizing: border-box;
                width: 200px;
                border-radius: 15px;
                background-color: #ffffff;
                box-shadow: 0 1px 3px 0 rgba(45, 77, 97, 0.2);
                overflow: hidden;
                text-decoration: none !important;
              }

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
              }

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
                font-weight: 700;
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
          <div className="head">
            <div className="background" style={coverStyle} />
            <div className="logo">
              <Logo src={collective.image} type={collective.type} website={collective.website} height={65} />
            </div>
          </div>
          <div className="body">
            <div className="name">{collective.name}</div>
            <div className="description" title={description}>
              {truncatedDescription}
            </div>
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
      </Link>
    );
  }
}

export default CollectiveCard;

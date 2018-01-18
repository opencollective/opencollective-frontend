import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { get } from 'lodash';
import Avatar from './Avatar';
import Logo from './Logo';
import { Router } from '../server/pages';
import { Link } from '../server/pages';
import Currency from './Currency';
import colors from '../constants/colors';
import { formatCurrency } from '../lib/utils';

class TierCard extends React.Component {

  static propTypes = {
    tier: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    className: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.anchor = get(props.tier, 'slug') || (get(props.tier, 'name') || "").toLowerCase().replace(/ /g,'-');

    this.messages = defineMessages({
      'contribution': { id: 'contribution', defaultMessage: '{n, plural, one {contribution} other {contributions}}' },
      'collective.types.organization': { id: 'collective.types.organization', defaultMessage: '{n, plural, one {organization} other {organizations}}'},
      'collective.types.user': { id: 'collective.types.user', defaultMessage: '{n, plural, one {people} other {people}}'},
      'collective.types.collective': { id: 'collective.types.collective', defaultMessage: '{n, plural, one {collective} other {collectives}}'},
      'tier.error.hostMissing' : { id: 'tier.error.hostMissing', defaultMessage: "Your collective needs a host before you can start accepting money." },
      'tier.error.collectiveInactive' : { id: 'tier.error.collectiveInactive', defaultMessage: "Your collective needs to be activated by your host before you can start accepting money." }
    });

  }

  showLastOrders(fromCollectiveTypeArray, limit) {
    const { tier } = this.props;
    const fromCollectives = tier.orders.map(o => o.fromCollective).filter(c => c && fromCollectiveTypeArray.indexOf(c.type) !== -1);
    if (fromCollectives.length === 0) return;
    return (
      <div>
        <style jsx>{`
          .fromCollectives {
            display: flex;
            flex-wrap: wrap;
          }
        `}</style>
        <div className={`fromCollectives ${fromCollectiveTypeArray[0].toLowerCase()}`}>
          { fromCollectives.slice(0, limit).map(fromCollective => (
            <div className="image" key={`image-${fromCollective.id}`}>
              <Link route={`/${fromCollective.slug}`}><a title={fromCollective.name}>
                { fromCollectiveTypeArray.indexOf('USER') !== -1 &&
                  <Avatar src={fromCollective.image} radius={32} />
                }
                { fromCollectiveTypeArray.indexOf('USER') === -1 &&
                  <Logo src={fromCollective.image} height={32} />
                }
              </a></Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  render() {

    const { collective, tier, intl } = this.props;
    const disabled = tier.amount > 0 && !collective.isActive;
    const totalOrders = tier.stats.totalOrders;
    let errorMsg;
    if (!collective.host) {
      errorMsg = `hostMissing`;
    } else if (!collective.isActive) {
      errorMsg = 'collectiveInactive';
    }
    const tooltip = disabled ? intl.formatMessage(this.messages[`tier.error.${errorMsg}`]) : '';

    const onClick = () => {
      if (disabled) return;
      const { referral } = this.props;
      const params = { collectiveSlug: collective.slug, TierId: tier.id };
      if (referral) {
        params.referral = referral;
      }
      Router.pushRoute('orderCollectiveTier', params);
    }

    return (
      <div className={`${this.props.className} TierCard`} id={this.anchor}>
        <style jsx global>{`
          html {
            --charcoal-grey-two: #373a3d;
            --charcoal-grey-three: #45484c;
            --main-custom-color: #8f47b3;
            --silver-four: #e1e4e6;
            --cool-grey: #9ea2a6;
            --attention: #e69900;
            --gunmetal: #505559;
          }
          .image img {
            border: 2px solid white;            
          }
          .TierCard .fromCollectives {
            margin: 1rem 0;
          }
          .TierCard .Avatar {
            margin-left: -15px;
          }
          .TierCard .fromCollectives.user:first-child {
            margin-left: 15px;
          }
        `}</style>
        <style jsx>{`
          .TierCard {
            width: 280px;
            overflow: hidden;
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04);
            border: solid 1px rgba(37, 39, 41, 0.16);
            margin: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .name {
            margin: 3rem 0rem 1rem 3rem;
            width: 160px;
            font-family: Rubik;
            font-size: 22px;
            font-weight: 300;
            line-height: 1.32;
            text-align: left;
            color: #373a3d;
            color: var(--charcoal-grey-two);
          }
          .amount {
            position: absolute;
            top: 3rem;
            right: 3rem;
            font-family: Rubik;
            font-size: 1.6rem;
            font-weight: 500;
            line-height: 1;
            text-align: right;
            color: #45484c;
            color: var(--charcoal-grey-three);
          }
          .interval {
            font-size: 1.2rem;
            color: ${colors.darkgray};
          }
          .limited {
            margin: 0rem 3rem;
            font-family: Rubik;
            font-size: 1.1rem;
            font-weight: 500;
            line-height: 2.09;
            letter-spacing: 1px;
            text-align: left;
            color: #e69900;
            color: var(--attention);
          }
          .description {
            margin: 1rem 3rem;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 1.4rem;
            color: var(--gunmetal);
          }
          .divider {
            margin: 1rem 0;
            width: 280px;
            height: 1px;
            background-color: #e1e4e6;
            background-color: var(--silver-four);
          }
          .footer {
            display: flex;
            align-items: center;
            margin: 2rem 3rem;
          }
          .action {
            margin-top: 1rem;
            width: 280px;
            height: 56px;
            border-radius: 0 0 8px 8px;
            background-color: ${colors.blue};
            font-family: Rubik, sans-serif;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .action:hover {
            background-color: ${colors.blueHover};
          }
          .action:active {
            background-color: ${colors.blueActive};
          }
          .action.disabled {
            background-color: var(--silver-four);
            cursor: not-allowed;
          }
          .totalOrders {
            height: 14px;
            font-family: Rubik;
            font-size: 12px;
            text-align: left;
            color: #9ea2a6;
            color: var(--cool-grey);
          }
        `}</style>
        <div className="name">
          {tier.name}
        </div>
        { tier.amount > 0 &&
          <div className="amount">
            <Currency value={tier.amount} currency={tier.currency || collective.currency} precision={0} />
            { tier.presets &&
            <span>+</span>
            }
            { tier.interval &&
              <div className="interval">
                <FormattedMessage
                  id="tier.interval"
                  defaultMessage="per {interval, select, month {month} year {year} other {}}"
                  values={{ interval: tier.interval }}
                  />
                </div>
            }
          </div>
        }
        { tier.maxQuantity > 0 &&
          <div className="limited">
            <FormattedMessage
              id="tier.limited"
              values={{ maxQuantity: tier.maxQuantity, availableQuantity: tier.stats.availableQuantity }}
              defaultMessage="LIMITED: {availableQuantity} LEFT OUT OF {maxQuantity}"
              />
          </div>
        }
        <div className="description">
          {tier.description || <FormattedMessage id="tier.defaultDescription" defaultMessage="Become a {name} for {amount} per {interval} and help us sustain our activities!" values={{ name: tier.name, amount: formatCurrency(tier.amount, tier.currency || collective.currency), interval: tier.interval}}/>}
        </div>
        { tier.stats.totalOrders > 0 &&
          <div>
            <div className="divider" />
            <div className="footer">
              <div className="lastOrders">
              { totalOrders > 0 &&
                <div className="totalOrders">
                  {totalOrders} {intl.formatMessage(this.messages[`contribution`], { n: totalOrders })}
                </div>
              }
              {this.showLastOrders(['USER'], 10)}
              {this.showLastOrders(['ORGANIZATION', 'COLLECTIVE'], 10)}
              </div>
            </div>
          </div>
        }
        <a className={`action ${disabled ? 'disabled' : ''}`} title={tooltip} onClick={onClick} >
          { tier.button && tier.button}
          { !tier.button &&
            <FormattedMessage id="tier.contribute" defaultMessage="contribute" />
          }
        </a>
      </div>
    );
  }
}

export default withIntl(TierCard);
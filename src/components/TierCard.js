import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import { formatCurrency } from '../lib/utils';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { ButtonGroup, Button } from 'react-bootstrap';
import { getCurrencySymbol, capitalize } from '../lib/utils';
import { get } from 'lodash';
import withIntl from '../lib/withIntl';
import Avatar from './Avatar';
import { Router } from '../server/pages';

class Tier extends React.Component {

  static propTypes = {
    tier: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    className: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.anchor = (get(this.tier, 'name') || "").toLowerCase().replace(/ /g,'-');
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};

    this.messages = defineMessages({
      'amount.label': { id: 'tier.amount.label', defaultMessage: 'amount' },
      'interval.label': { id: 'tier.interval.label', defaultMessage: 'interval' },
      'month': { id: 'tier.interval.month', defaultMessage: 'month' },
      'year': { id: 'tier.interval.year', defaultMessage: 'year' },
      'interval.onetime': { id: 'tier.interval.onetime', defaultMessage: 'one time' },
      'interval.month': { id: 'tier.interval.monthly', defaultMessage: 'monthly' },
      'interval.year': { id: 'tier.interval.yearly', defaultMessage: 'yearly' }
    });

  }

  render() {

    const { collective, tier } = this.props;

    return (
      <div className={`${this.props.className} TierCard`} id={this.anchor}>
        <style jsx global>{`
          html {
            --charcoal-grey-two: #373a3d;
            --main-custom-color: #8f47b3;
            --silver-four: #e1e4e6;
            --cool-grey: #9ea2a6;
            --attention: #e69900;
            --gunmetal: #505559;
          }
          .avatar img {
            border: 2px solid white;
            margin-left: -15px;
          }
          .avatar:first img {
            margin-left: 0;
          }
        `}</style>
        <style jsx>{`
          .TierCard {
            width: 280px;
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04);
            border: solid 1px rgba(37, 39, 41, 0.16);
            margin: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .title {
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
          .body {
            margin: 1rem 3rem;
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
            margin: 3rem;
          }
          .lastOrders {
            display: flex;
          }
          .totalOrders {
            width: 81px;
            height: 14px;
            font-family: Rubik;
            font-size: 12px;
            text-align: left;
            color: #9ea2a6;
            color: var(--cool-grey);
            margin: 0 1rem;
          }
          .action {
            margin-top: 1rem;
            width: 280px;
            height: 56px;
            border-radius: 8px;
            background-color: #8f47b3;
            background-color: var(--main-custom-color);
            box-shadow: inset 0 -4px 0 0 rgba(37, 39, 41, 0.15);
            font-family: Rubik, sans-serif;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `}</style>
        <div className="title">
          {tier.name}
        </div>
        { tier.maxQuantity > 0 &&
          <div className="limited">
            <FormattedMessage
              id="tier.limited"
              values={{ maxQuantity: tier.maxQuantity, availableQuantity: tier.stats.availableQuantity }}
              defaultMessage="LIMITED: {availableQuantity} LEFT OUT OF {maxQuantity}"
              />
          </div>
        }
        <div className="body">
          {tier.description}
        </div>
        { tier.stats.totalOrders > 0 &&
          <div>
            <div className="divider" />
            <div className="footer">
              <div className="lastOrders">
                {tier.orders.map(order => (
                  <div className="avatar" key={`avatar-${order.fromCollective.id}`}>
                    <Avatar src={order.fromCollective.image} radius={32} />
                  </div>
                ))}
              </div>
              <div className="totalOrders">
                <FormattedMessage id="tier.totalOrders" values={ { n: (tier.stats.totalOrders - tier.orders.length) } } defaultMessage="+ {n} people" />
              </div>
            </div>
          </div>
        }
        <a className="action" onClick={() => Router.pushRoute(`/${collective.slug}/order/${tier.id}`)}>
          <FormattedMessage id="tier.contribute" defaultMessage="contribute" />
        </a>
      </div>
    );
  }
}

export default withIntl(Tier);
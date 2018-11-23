import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';

import withIntl from '../../../lib/withIntl';
import Avatar from '../../../components/Avatar';
import { capitalize } from '../../../lib/utils';
import Link from '../../../components/Link';
import Moment from '../../../components/Moment';

import AmountCurrency from './AmountCurrency';
import MarkOrderAsPaidBtn from './MarkOrderAsPaidBtn';
import colors from '../../../constants/colors';
import OrderDetails from './OrderDetails';

class Order extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    order: PropTypes.object,
    view: PropTypes.string, // "compact" for homepage (can't edit order, don't show header), "list" for list view, "details" for details view
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    allowPayAction: PropTypes.bool,
    lockPayAction: PropTypes.func,
    unlockPayAction: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      order: {},
      mode: undefined,
    };

    this.messages = defineMessages({
      pending: { id: 'order.pending', defaultMessage: 'pending' },
      paid: { id: 'order.paid', defaultMessage: 'paid' },
      error: { id: 'order.error', defaultMessage: 'error' },
      active: { id: 'order.active', defaultMessage: 'active' },
      cancelled: { id: 'order.cancelled', defaultMessage: 'cancelled' },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  render() {
    const {
      intl,
      collective,
      order,
      includeHostedCollectives,
      LoggedInUser,
      view,
    } = this.props;

    const title = order.description;
    const status = order.status.toLowerCase();
    const canMarkOrderAsPaid =
      LoggedInUser &&
      collective.host &&
      LoggedInUser.canEditCollective(collective.host);
    return (
      <div className={`order ${status} ${this.state.mode}View`}>
        <style jsx>
          {`
            .order {
              width: 100%;
              margin: 0.5em 0;
              padding: 0.5em;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            .OrderId {
              color: ${colors.gray};
              margin-left: 0.5rem;
            }
            .order.detailsView {
              background-color: #fafafa;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1.6rem;
            }
            .body {
              overflow: hidden;
              font-size: 1.4rem;
              width: 100%;
            }
            .description {
              text-overflow: ellipsis;
              white-space: nowrap;
              overflow: hidden;
              display: block;
            }
            .meta {
              color: #919599;
              font-size: 1.2rem;
            }
            .meta .metaItem {
              margin: 0 0.2rem;
            }
            .meta .collective {
              margin-right: 0.2rem;
            }
            .amount .balance {
              font-size: 1.2rem;
              color: #919599;
            }
            .amount {
              margin-left: 0.5rem;
              text-align: right;
              font-size: 1.5rem;
              font-weight: 300;
            }
            .rejected .status {
              color: #e21a60;
            }
            .approved .status {
              color: #72ce00;
            }

            .status {
              text-transform: uppercase;
            }

            .actions > div {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
              margin: 0.5rem 0;
            }

            .actions .leftColumn {
              width: 72px;
              margin-right: 1rem;
              float: left;
            }

            .orderActions :global(> div) {
              margin-right: 0.5rem;
            }

            @media (max-width: 600px) {
              .order {
                max-height: 50rem;
                padding: 2rem 0.5rem;
              }
              .order.detailsView {
                max-height: 45rem;
              }
              .details {
                max-height: 30rem;
              }
            }
          `}
        </style>
        <style jsx global>
          {`
            .order .actions > div > div {
              margin-right: 0.5rem;
            }

            @media screen and (max-width: 700px) {
              .order .PayOrderBtn ~ .RejectOrderBtn {
                flex-grow: 1;
              }
              .order .SmallButton {
                flex-grow: 1;
                margin-top: 1rem;
              }
              .order .SmallButton button {
                width: 100%;
              }
            }
          `}
        </style>

        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: order.fromCollective.slug }}
            title={order.fromCollective.name}
            passHref
          >
            <Avatar
              src={order.fromCollective.image}
              type={order.fromCollective.type}
              name={order.fromCollective.name}
              key={order.fromCollective.id}
              radius={40}
              className="noFrame"
            />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="amount pullRight">
              <AmountCurrency
                amount={order.totalAmount}
                currency={order.currency}
              />
            </div>
            <div className="description">
              <Link
                route={`/${collective.slug}/orders/${order.id}`}
                title={capitalize(title)}
              >
                {capitalize(title)}
                {view !== 'compact' && (
                  <span className="OrderId">#{order.id}</span>
                )}
              </Link>
            </div>
            <div className="meta">
              <Moment relative={true} value={order.createdAt} />
              {' | '}
              {includeHostedCollectives && (
                <span className="collective">
                  <Link route={`/${order.collective.slug}`}>
                    {order.collective.slug}
                  </Link>
                </span>
              )}
              {' | '}
              <span className="status">
                {intl.formatMessage(this.messages[status])}
              </span>
            </div>
          </div>
          <OrderDetails order={order} />
          {order.status === 'PENDING' && canMarkOrderAsPaid && (
            <MarkOrderAsPaidBtn order={order} collective={order.collective} />
          )}
        </div>
      </div>
    );
  }
}

export default withIntl(Order);

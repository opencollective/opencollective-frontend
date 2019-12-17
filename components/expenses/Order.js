import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import colors from '../../lib/constants/colors';
import { capitalize } from '../../lib/utils';

import Avatar from '..//Avatar';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import Moment from '../Moment';
import AmountCurrency from './AmountCurrency';
import MarkOrderAsPaidBtn from './MarkOrderAsPaidBtn';
import OrderDetails from './OrderDetails';
import TransactionDetails from './TransactionDetails';

class Order extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    transactions: PropTypes.array,
    order: PropTypes.object,
    view: PropTypes.string, // "compact" for homepage (can't edit order, don't show header), "summary" for list view, "details" for details view
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    onClickCancel: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      order: {},
      mode: undefined,
      view: 'summary',
    };

    this.messages = defineMessages({
      pending: { id: 'order.pending', defaultMessage: 'pending' },
      paid: { id: 'order.paid', defaultMessage: 'paid' },
      error: { id: 'order.error', defaultMessage: 'error' },
      active: { id: 'order.active', defaultMessage: 'active' },
      cancelled: { id: 'order.cancelled', defaultMessage: 'cancelled' },
      expired: { id: 'order.expired', defaultMessage: 'expired' },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  toggleDetails = () => {
    this.setState(state => ({
      ...state,
      view: state.view === 'details' ? 'summary' : 'details',
    }));
  };

  render() {
    const {
      intl,
      collective,
      order,
      includeHostedCollectives,
      LoggedInUser,
      view,
      editable,
      transactions,
    } = this.props;

    if (!order.collective) {
      console.warn('no collective attached to order', order);
    }

    const isRoot = LoggedInUser && LoggedInUser.isRoot();
    const isHostAdmin = LoggedInUser && LoggedInUser.isHostAdmin(collective);

    const title = order.description;
    const status = order.status.toLowerCase();
    const canMarkOrderAsPaid = LoggedInUser && collective.host && LoggedInUser.canEditCollective(collective.host);

    let { mode } = this.state;
    if (editable && LoggedInUser && !mode) {
      switch (order.status) {
        case 'PENDING':
          mode = canMarkOrderAsPaid && 'details';
          break;
        case 'ERROR':
          mode = 'details';
          break;
      }
    }
    mode = mode || 'summary';

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
          <LinkCollective collective={order.fromCollective} title={order.fromCollective.name} passHref>
            <Avatar collective={order.fromCollective} key={order.fromCollective.id} radius={40} className="noFrame" />
          </LinkCollective>
        </div>
        <div className="body">
          <div className="header">
            <div className="amount pullRight">
              <AmountCurrency amount={order.totalAmount} currency={order.currency} />
            </div>
            <div className="description">
              <Link route={`/${collective.slug}/orders/${order.id}`} title={capitalize(title)}>
                {capitalize(title)}
                {view !== 'compact' && <span className="OrderId">#{order.id}</span>}
              </Link>
            </div>
            <div className="meta">
              <Moment relative={true} value={order.createdAt} />
              {' | '}
              {includeHostedCollectives && order.collective && (
                <span className="collective">
                  <LinkCollective collective={order.collective}>{order.collective.slug}</LinkCollective>
                  {' | '}
                </span>
              )}
              <span className="status">{intl.formatMessage(this.messages[status])}</span>
              {transactions && transactions.length === 1 && (
                <span>
                  {' | '}
                  <a className="toggleDetails" onClick={this.toggleDetails}>
                    {this.state.view === 'details' ? (
                      <FormattedMessage id="closeDetails" defaultMessage="Close Details" />
                    ) : (
                      <FormattedMessage id="viewDetails" defaultMessage="View Details" />
                    )}
                  </a>
                </span>
              )}
            </div>
          </div>
          <OrderDetails order={order} mode={mode} />
          {this.state.view === 'details' && transactions && transactions.length === 1 && (
            <TransactionDetails {...transactions[0]} mode="open" canRefund={isRoot || isHostAdmin} /> // Rendering credit transaction details
          )}
          {order.status === 'PENDING' && canMarkOrderAsPaid && (
            <Flex>
              <MarkOrderAsPaidBtn order={order} collective={order.collective} />
              <StyledButton bg="red.500" color="#fff" onClick={() => this.props.onClickCancel(order.id)}>
                <FormattedMessage id="order.pending.cancel" defaultMessage="Cancel" />
              </StyledButton>
            </Flex>
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(Order);

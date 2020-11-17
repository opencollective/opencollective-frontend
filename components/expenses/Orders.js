import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import colors from '../../lib/constants/colors';

import { Box } from '../Grid';

import Order from './Order';

class Orders extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    orders: PropTypes.array,
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
    editable: PropTypes.bool,
    view: PropTypes.string, // "compact" for homepage (can't edit order, don't show header), "summary" for list view, "details" for details view
    includeHostedCollectives: PropTypes.bool,
    filters: PropTypes.bool, // show or hide filters (all/pending/paid/error/active)
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.refetch = this.refetch.bind(this);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = {
      loading: false,
      isPayActionLocked: false,
      showModal: false,
      orderIdToBeCancelled: null,
    };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  refetch(status) {
    this.setState({ status, loading: true });
    this.props.refetch({ status }).then(() => {
      this.setState({ loading: false });
    });
  }

  render() {
    const { collective, orders, LoggedInUser, editable, view, includeHostedCollectives, filters } = this.props;

    if (!orders) {
      return <div />;
    }

    return (
      <Box className="Orders" mx="auto" maxWidth="80rem">
        <style jsx>
          {`
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .filter {
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
              margin-bottom: 20px;
            }
            :global(.filterBtnGroup) {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            :global(.filterBtn) {
              width: 25%;
            }
            .empty {
              text-align: center;
              margin: 4rem;
              color: ${colors.darkgray};
            }
            .itemsList {
              position: relative;
            }
            .itemsList .item {
              border-bottom: 1px solid #e8e9eb;
            }
            .loading {
              color: ${colors.darkgray};
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(255, 255, 255, 0.85);
              text-transform: uppercase;
              letter-spacing: 3px;
              font-weight: bold;
              z-index: 10;
              -webkit-backdrop-filter: blur(2px);
              backdrop-filter: blur(5px);
            }
          `}
        </style>

        {filters && (
          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button
                className="filterBtn all"
                bsSize="small"
                bsStyle={!this.state.status ? 'primary' : 'default'}
                onClick={() => this.refetch()}
              >
                <FormattedMessage id="orders.all" defaultMessage="All" />
              </Button>
              <Button
                className="filterBtn pending"
                bsSize="small"
                bsStyle={this.state.status === 'PENDING' ? 'primary' : 'default'}
                onClick={() => this.refetch('PENDING')}
              >
                <FormattedMessage id="order.pending" defaultMessage="Pending" />
              </Button>
              <Button
                className="filterBtn paid"
                bsSize="small"
                bsStyle={this.state.status === 'PAID' ? 'primary' : 'default'}
                onClick={() => this.refetch('PAID')}
              >
                <FormattedMessage id="order.paid" defaultMessage="Paid" />
              </Button>
              <Button
                className="filterBtn cancelled"
                bsSize="small"
                bsStyle={this.state.status === 'CANCELLED' ? 'primary' : 'default'}
                onClick={() => this.refetch('CANCELLED')}
              >
                <FormattedMessage id="order.cancelled" defaultMessage="Cancelled" />
              </Button>
              <Button
                className="filterBtn error"
                bsSize="small"
                bsStyle={this.state.status === 'ERROR' ? 'primary' : 'default'}
                onClick={() => this.refetch('ERROR')}
              >
                <FormattedMessage id="order.error" defaultMessage="Error" />
              </Button>
            </ButtonGroup>
          </div>
        )}

        <div className="itemsList">
          {this.state.loading && (
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          )}
          {orders.map(order => (
            <div className="item" key={order.id}>
              <Order
                collective={order.collective || collective}
                order={order}
                transactions={order.transactions}
                editable={editable}
                view={view}
                includeHostedCollectives={includeHostedCollectives}
                LoggedInUser={LoggedInUser}
              />
            </div>
          ))}
          {orders.length === 0 && (
            <div className="empty">
              <FormattedMessage id="orders.empty" defaultMessage="No orders" />
            </div>
          )}
          {orders.length >= 10 && orders.length % 10 === 0 && (
            <div className="loadMoreBtn">
              <Button bsStyle="default" onClick={this.fetchMore}>
                {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
              </Button>
            </div>
          )}
        </div>
      </Box>
    );
  }
}

export default Orders;

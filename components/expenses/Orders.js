import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import { Box } from '@rebass/grid';

import colors from '../../lib/constants/colors';

import Order from './Order';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../StyledModal';
import Container from '../Container';
import StyledButton from '../StyledButton';
import { P } from '../Text';

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
    markPendingOrderAsExpired: PropTypes.func,
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

  cancelPendingOrder = async () => {
    const { orderIdToBeCancelled } = this.state;
    try {
      await this.props.markPendingOrderAsExpired(orderIdToBeCancelled);
      this.setState({
        showModal: false,
        orderIdToBeCancelled: null,
      });
    } catch (err) {
      this.setState({
        showModal: false,
      });
      console.error(err);
    }
  };

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
                <FormattedMessage id="orders.all" defaultMessage="all" />
              </Button>
              <Button
                className="filterBtn pending"
                bsSize="small"
                bsStyle={this.state.status === 'PENDING' ? 'primary' : 'default'}
                onClick={() => this.refetch('PENDING')}
              >
                <FormattedMessage id="orders.pending" defaultMessage="pending" />
              </Button>
              <Button
                className="filterBtn paid"
                bsSize="small"
                bsStyle={this.state.status === 'PAID' ? 'primary' : 'default'}
                onClick={() => this.refetch('PAID')}
              >
                <FormattedMessage id="orders.paid" defaultMessage="paid" />
              </Button>
              <Button
                className="filterBtn cancelled"
                bsSize="small"
                bsStyle={this.state.status === 'CANCELLED' ? 'primary' : 'default'}
                onClick={() => this.refetch('CANCELLED')}
              >
                <FormattedMessage id="orders.cancelled" defaultMessage="cancelled" />
              </Button>
              <Button
                className="filterBtn error"
                bsSize="small"
                bsStyle={this.state.status === 'ERROR' ? 'primary' : 'default'}
                onClick={() => this.refetch('ERROR')}
              >
                <FormattedMessage id="orders.error" defaultMessage="error" />
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
                onClickCancel={orderId => {
                  this.setState({ showModal: true, orderIdToBeCancelled: orderId });
                }}
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
        <Modal show={this.state.showModal} width="570px" onClose={() => this.setState({ showModal: false })}>
          <ModalHeader>
            <FormattedMessage id="order.cancel.modal.header" defaultMessage="Cancel Order" />
          </ModalHeader>
          <ModalBody>
            <P>
              <FormattedMessage
                id="order.cancel.modal.body"
                defaultMessage={'Are you sure you want to cancel this order?'}
              />
            </P>
          </ModalBody>
          <ModalFooter>
            <Container display="flex" justifyContent="flex-end">
              <StyledButton mx={20} onClick={() => this.setState({ showModal: false })}>
                <FormattedMessage id="no" defaultMessage={'No'} />
              </StyledButton>
              <StyledButton buttonStyle="primary" onClick={this.cancelPendingOrder}>
                <FormattedMessage id="yes" defaultMessage={'Yes'} />
              </StyledButton>
            </Container>
          </ModalFooter>
        </Modal>
      </Box>
    );
  }
}

const markPendingOrderAsExpiredQuery = gql`
  mutation markPendingOrderAsExpired($id: Int!) {
    markPendingOrderAsExpired(id: $id) {
      id
      status
      collective {
        id
        stats {
          id
          balance
        }
      }
    }
  }
`;

const addMutation = graphql(markPendingOrderAsExpiredQuery, {
  props: ({ mutate }) => ({
    markPendingOrderAsExpired: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMutation(Orders);

import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';

import colors from '../../lib/constants/colors';

import Transaction from './Transaction';
import TransactionsExportPopoverAndButton from './TransactionsExportPopoverAndButton';
import DownloadInvoicesPopOver from './DownloadInvoicesPopOver';

class Transactions extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    transactions: PropTypes.array,
    filters: PropTypes.bool, // show or hide filters (all/credits/debits)
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
    LoggedInUser: PropTypes.object,
    dateDisplayType: PropTypes.oneOf(['date', 'interval']),
    showCSVlink: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.refetch = this.refetch.bind(this);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = { loading: false, fetchingMore: false };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ fetchingMore: true });
    this.props.fetchMore().then(() => {
      this.setState({ fetchingMore: false });
    });
  }

  refetch(type) {
    this.setState({ type, loading: true });
    this.props.refetch({ type }).then(() => {
      this.setState({ loading: false });
    });
  }

  canDownloadInvoice(transaction, isRoot, isCollectiveAdmin) {
    const { collective } = this.props;

    // User must be logged in as collective admin or root
    if (!isCollectiveAdmin && !isRoot) {
      return false;
    }

    // Transactions invoices for gift cards are only available to emitter collectives
    if (transaction.usingVirtualCardFromCollective) {
      return transaction.usingVirtualCardFromCollective.id === collective.id;
    }

    return true;
  }

  canRefund(isRoot, isHostAdmin /* , isCollectiveAdmin */) {
    /** || isCollectiveAdmin -- disabled while we enforce security for the refund endpoint on the API */
    return isRoot || isHostAdmin;
  }

  render() {
    const { collective, transactions, LoggedInUser, showCSVlink, filters } = this.props;

    if (!transactions) {
      return <div />;
    }

    const isRoot = LoggedInUser && LoggedInUser.isRoot();
    const isHostAdmin = LoggedInUser && LoggedInUser.isHostAdmin(collective);
    const isCollectiveAdmin = LoggedInUser && LoggedInUser.canEditCollective(collective);
    return (
      <div className="Transactions">
        <style jsx>
          {`
            .Transactions {
              min-width: 30rem;
              max-width: 1080px;
              width: 100%;
            }
            :global(.loadMoreBtn) {
              margin: 1rem;
              text-align: center;
            }
            .filter {
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
            }
            :global(.filterBtnGroup) {
              width: 100%;
            }
            :global(.filterBtn) {
              width: 33%;
            }
            .empty {
              text-align: center;
              margin: 4rem;
              color: ${colors.darkgray};
            }
            .itemsList {
              position: relative;
            }
            .itemsList :global(.transaction) {
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

        {showCSVlink && transactions.length > 0 && (
          <div>
            <TransactionsExportPopoverAndButton collective={collective} />
            {(collective.type === 'ORGANIZATION' || collective.type === 'USER') &&
              LoggedInUser &&
              LoggedInUser.canEditCollective(collective) && (
                <DownloadInvoicesPopOver fromCollectiveSlug={collective.slug} />
              )}
          </div>
        )}

        {filters && (
          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button
                className="filterBtn all"
                bsSize="small"
                bsStyle={!this.state.type ? 'primary' : 'default'}
                onClick={() => this.refetch()}
              >
                <FormattedMessage id="transactions.all" defaultMessage="all" />
              </Button>
              <Button
                className="filterBtn credit"
                bsSize="small"
                bsStyle={this.state.type === 'CREDIT' ? 'primary' : 'default'}
                onClick={() => this.refetch('CREDIT')}
              >
                <FormattedMessage id="transactions.credits" defaultMessage="credits" />
              </Button>
              <Button
                className="filterBtn debit"
                bsSize="small"
                bsStyle={this.state.type === 'DEBIT' ? 'primary' : 'default'}
                onClick={() => this.refetch('DEBIT')}
              >
                <FormattedMessage id="transactions.debits" defaultMessage="debits" />
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
          {transactions.map(transaction => (
            <Box className="transaction" key={transaction.id} my={3}>
              <Transaction
                collective={collective}
                {...transaction}
                isRefund={Boolean(transaction.refundTransaction)}
                canRefund={this.canRefund(isRoot, isHostAdmin, isCollectiveAdmin)}
                canDownloadInvoice={this.canDownloadInvoice(transaction, isRoot, isCollectiveAdmin)}
                dateDisplayType={this.props.dateDisplayType}
              />
            </Box>
          ))}
          {transactions.length === 0 && (
            <div className="empty">
              <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
            </div>
          )}
          {transactions.length >= 10 && transactions.length % 10 === 0 && (
            <div className="loadMoreBtn">
              <Button bsStyle="default" onClick={this.fetchMore}>
                {this.state.fetchingMore && <FormattedMessage id="loading" defaultMessage="loading" />}
                {!this.state.fetchingMore && <FormattedMessage id="loadMore" defaultMessage="load more" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Transactions;

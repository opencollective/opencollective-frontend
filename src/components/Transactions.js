import React from 'react';
import PropTypes from 'prop-types';
import Transaction from './Transaction';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import colors from '../constants/colors';

class Transactions extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transactions: PropTypes.array,
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.refetch = this.refetch.bind(this);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = { loading: false };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  refetch(type) {
    this.setState({type, loading: true});
    this.props.refetch({type}).then(() => {
      this.setState({ loading: false });
    });
  }

  render() {
    const { collective, transactions, LoggedInUser } = this.props;

    if (!transactions) {
      return (<div />);
    }

    return (
      <div className="Transactions">
        <style jsx>{`
          .Transactions {
            min-width: 40rem;
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
            background: rgba(255,255,255,0.85);
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: bold;
            z-index: 10;
            -webkit-backdrop-filter: blur(2px);
            backdrop-filter: blur(5px);
          }
        `}</style>

        <div className="filter">
          <ButtonGroup className="filterBtnGroup">
            <Button className="filterBtn" bsSize="small" bsStyle={!this.state.type ? 'primary' : 'default'} onClick={() => this.refetch()}>
              <FormattedMessage id='transactions.all' defaultMessage='all' />
            </Button>
            <Button className="filterBtn" bsSize="small" bsStyle={this.state.type === 'CREDIT' ? 'primary' : 'default'} onClick={() => this.refetch('CREDIT')}>
              <FormattedMessage id='transactions.credits' defaultMessage='credits' />
            </Button>
            <Button className="filterBtn" bsSize="small" bsStyle={this.state.type === 'DEBIT' ? 'primary' : 'default'} onClick={() => this.refetch('DEBIT')}>
              <FormattedMessage id='transactions.debits' defaultMessage='debits' />
            </Button>
          </ButtonGroup>
        </div>

        <div className="itemsList">
          { this.state.loading &&
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          }
          {transactions.map((transaction) =>
            <Transaction
              key={transaction.id}
              collective={collective}
              transaction={transaction}
              LoggedInUser={LoggedInUser}
              />
          )}
          { transactions.length === 0 &&
            <div className="empty">
              <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
            </div>
          }
          { transactions.length >= 10 && transactions.length % 10 === 0 &&
            <div className="loadMoreBtn">
              <Button bsStyle='default' onClick={this.fetchMore}>
                {this.state.loading && <FormattedMessage id='loading' defaultMessage='loading' />}
                {!this.state.loading && <FormattedMessage id='loadMore' defaultMessage='load more' />}
              </Button>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Transactions;
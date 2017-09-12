import React from 'react';
import PropTypes from 'prop-types';
import Transaction from './Transaction';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

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
    this.setState({type});
    this.props.refetch({type});
  }

  render() {
    const { collective, transactions, LoggedInUser } = this.props;

    return (
      <div className="Transactions">
        <style jsx>{`
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
        `}</style>

        <div className="filter">
          <ButtonGroup className="filterBtnGroup">
            <Button className="filterBtn" bsStyle={!this.state.type ? 'primary' : 'default'} onClick={() => this.refetch()}>
              <FormattedMessage id='transactions.all' defaultMessage='all' />
            </Button>
            <Button className="filterBtn" bsStyle={this.state.type === 'DONATION' ? 'primary' : 'default'} onClick={() => this.refetch('DONATION')}>
              <FormattedMessage id='transactions.donations' defaultMessage='donations' />
            </Button>
            <Button className="filterBtn" bsStyle={this.state.type === 'EXPENSE' ? 'primary' : 'default'} onClick={() => this.refetch('EXPENSE')}>
              <FormattedMessage id='transactions.expenses' defaultMessage='expenses' />
            </Button>
          </ButtonGroup>
        </div>

        {transactions.map((transaction) =>
          <Transaction
            key={transaction.id}
            collective={collective}
            transaction={transaction}
            LoggedInUser={LoggedInUser}
            />
        )}
        { transactions.length % 10 === 0 &&
          <div className="loadMoreBtn">
            <Button bsStyle='default' onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id='loading' defaultMessage='loading' />}
              {!this.state.loading && <FormattedMessage id='loadMore' defaultMessage='load more' />}
            </Button>
          </div>
        }
      </div>
    );
  }
}

export default Transactions;
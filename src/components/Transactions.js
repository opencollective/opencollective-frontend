import React from 'react';
import PropTypes from 'prop-types';
import Transaction from './Transaction';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

class Transactions extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transactions: PropTypes.array,
    fetchMore: PropTypes.func
  }

  constructor(props) {
    super(props);
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

  render() {
    const { collective, transactions } = this.props;

    return (
      <div className="Transactions">
        <style jsx>{`
          :global(.loadMoreBtn) {
            margin: 1rem;
            text-align: center;
          }
        `}</style>
        {transactions.map((transaction) =>
          <Transaction
            key={transaction.id}
            collective={collective}
            transaction={transaction}
            />
        )}
        <div className="loadMoreBtn">
          <Button bsStyle='default' onClick={this.fetchMore}>
            {this.state.loading && <FormattedMessage id='transactions.loading' defaultMessage='loading' />}
            {!this.state.loading && <FormattedMessage id='transactions.loadMore' defaultMessage='load more' />}
          </Button>
        </div>
      </div>
    );
  }
}

export default Transactions;
import React from 'react';
import PropTypes from 'prop-types';

import Error from '../../../components/Error';

import Transactions from './Transactions';

class TransactionsWithDataBase extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    filters: PropTypes.bool,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.props.LoggedInUser && nextProps.LoggedInUser) {
      return this.props.data.refetch();
    }
  }

  render() {
    const { data, LoggedInUser, collective, fetchMore, showCSVlink, filters } = this.props;

    if (data.error) {
      console.error('graphql error>>>', data.error.message);
      return <Error message="GraphQL error" />;
    }

    const transactions = data.allTransactions;

    return (
      <div className="TransactionsContainer">
        <Transactions
          collective={collective}
          transactions={transactions}
          refetch={data.refetch}
          fetchMore={fetchMore}
          filters={filters}
          LoggedInUser={LoggedInUser}
          showCSVlink={showCSVlink}
        />
      </div>
    );
  }
}

export default TransactionsWithDataBase;

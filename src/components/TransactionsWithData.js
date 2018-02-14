import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import Transactions from '../components/Transactions';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class TransactionsWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    limit: PropTypes.number,
    filters: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.LoggedInUser && nextProps.LoggedInUser) {
      return this.props.data.refetch();
    }
  }

  render() {
    const { data, LoggedInUser, collective, fetchMore, showCSVlink, filters } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
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


export const getTransactionsQuery = gql`
query Transactions($CollectiveId: Int!, $type: String, $limit: Int, $offset: Int, $dateFrom: String, $dateTo: String) {
  allTransactions(CollectiveId: $CollectiveId, type: $type, limit: $limit, offset: $offset, dateFrom: $dateFrom, dateTo: $dateTo) {
    id
    refundId
    uuid
    description
    createdAt
    type
    amount
    currency
    netAmountInCollectiveCurrency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    paymentMethod {
      service
    }
    fromCollective {
      id
      name
      slug
      image
    }
    host {
      id
      name
      currency
    }
    ... on Expense {
      category
      attachment
    }
    ... on Order {
      subscription {
        interval
      }
    }
  }
}
`;


const TRANSACTIONS_PER_PAGE = 10;
export const addTransactionsData = graphql(getTransactionsQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        offset: 0,
        limit: props.limit || TRANSACTIONS_PER_PAGE * 2
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allTransactions.length,
          limit: TRANSACTIONS_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allTransactions: [...previousResult.allTransactions, ...fetchMoreResult.allTransactions]
          })
        }
      })
    }
  })  
});


export default addTransactionsData(withIntl(TransactionsWithData));

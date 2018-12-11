import { graphql } from 'react-apollo';

import withIntl from '../../../lib/withIntl';
import { getTransactionsQuery } from '../../../graphql/queries';
import TransactionsWithDataBase from './TransactionsWithDataBase';

const TRANSACTIONS_PER_PAGE = 10;
export const addTransactionsData = graphql(getTransactionsQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        offset: 0,
        limit: props.limit || TRANSACTIONS_PER_PAGE * 2,
        fetchDataFromLedger: true,
        includeHostedCollectivesTransactions: false /** if the collective is a host we can show
          all transactions(from the host itself and also its collective) through this flag */,
      },
    };
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allTransactions.length,
          limit: TRANSACTIONS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allTransactions: [...previousResult.allTransactions, ...fetchMoreResult.allTransactions],
          });
        },
      });
    },
  }),
});

export default addTransactionsData(withIntl(TransactionsWithDataBase));
// export default addTransactionsData(withIntl(TransactionsWithDataFromLedger));

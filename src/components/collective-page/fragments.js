import gql from 'graphql-tag';

/**
 * Query the transactions and expenses for the collective, to show in the
 * "Budget" section.
 */
export const TransactionsAndExpensesFragment = gql`
  fragment TransactionsAndExpensesFragment on Collective {
    transactions(limit: 3) {
      id
      netAmountInCollectiveCurrency
      description
      type
      createdAt
      fromCollective {
        id
        slug
        name
        image
      }
      usingVirtualCardFromCollective {
        id
        slug
        name
      }
    }
    expenses(limit: 3) {
      id
      amount
      description
      createdAt
      category
      transaction {
        id
      }
      fromCollective {
        id
        slug
        name
        image
      }
    }
  }
`;

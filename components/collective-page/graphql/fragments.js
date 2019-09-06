import gql from 'graphql-tag';

/**
 * Query the transactions and expenses for the collective, to show in the
 * "Budget" section.
 */
export const TransactionsAndExpensesFragment = gql`
  fragment TransactionsAndExpensesFragment on Collective {
    transactions(limit: 3) {
      id
      amount
      description
      type
      createdAt
      fromCollective {
        id
        slug
        name
        type
        imageUrl
        isIncognito
      }
      usingVirtualCardFromCollective {
        id
        slug
        name
        type
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
        type
        imageUrl
        isIncognito
      }
    }
  }
`;

/**
 * Fields fetched for updates
 */
export const UpdatesFieldsFragment = gql`
  fragment UpdatesFieldsFragment on UpdateType {
    id
    slug
    title
    summary
    createdAt
    publishedAt
    isPrivate
    userCanSeeUpdate
    fromCollective {
      id
      type
      name
      slug
      imageUrl
    }
  }
`;

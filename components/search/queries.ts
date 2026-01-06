import { gql } from '@apollo/client';

export const searchAccountFieldsFragment = gql`
  fragment SearchAccountFields on Account {
    id
    name
    slug
    imageUrl(height: $imageHeight)
    type
    ... on AccountWithHost {
      host {
        id
        name
        slug
      }
    }
    ... on AccountWithParent {
      parent {
        id
        name
        slug
      }
    }
  }
`;

const searchCommentFieldsFragment = gql`
  fragment SearchCommentFields on Comment {
    id
    html
    createdAt
    type
    fromAccount {
      ...SearchAccountFields
    }
    expense {
      id
      legacyId
      description
      account {
        ...SearchAccountFields
      }
    }
    update {
      id
      legacyId
      title
      account {
        ...SearchAccountFields
      }
    }
    order {
      id
      legacyId
      toAccount {
        ...SearchAccountFields
      }
    }
    hostApplication {
      id
      account {
        ...SearchAccountFields
      }
      host {
        ...SearchAccountFields
      }
    }
    conversation {
      id
      slug
      account {
        ...SearchAccountFields
      }
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchExpenseFieldsFragment = gql`
  fragment SearchExpenseFields on Expense {
    id
    description
    legacyId
    type
    status
    amountV2 {
      valueInCents
      currency
    }
    payee {
      ...SearchAccountFields
    }
    account {
      ...SearchAccountFields
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchOrderFieldsFragment = gql`
  fragment SearchOrderFields on Order {
    id
    legacyId
    description
    status
    amount {
      valueInCents
      currency
    }
    toAccount {
      ...SearchAccountFields
    }
    fromAccount {
      ...SearchAccountFields
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchTransactionFieldsFragment = gql`
  fragment SearchTransactionFields on Transaction {
    id
    legacyId
    description
    type
    kind
    netAmount {
      valueInCents
      currency
    }
    account {
      ...SearchAccountFields
    }
    oppositeAccount {
      ...SearchAccountFields
    }
    host {
      id
      slug
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchUpdateFieldsFragment = gql`
  fragment SearchUpdateFields on Update {
    id
    legacyId
    slug
    title
    html
    account {
      ...SearchAccountFields
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchHostApplicationFieldsFragment = gql`
  fragment SearchHostApplicationFields on HostApplication {
    id
    status
    createdAt
    account {
      ...SearchAccountFields
    }
    host {
      ...SearchAccountFields
    }
  }
  ${searchAccountFieldsFragment}
`;

export const searchCommandQuery = gql`
  query SearchCommand(
    $searchTerm: String!
    $host: AccountReferenceInput
    $account: AccountReferenceInput
    $limit: Int!
    $imageHeight: Int
    $useTopHits: Boolean
    $includeAccounts: Boolean!
    $includeComments: Boolean!
    $includeExpenses: Boolean!
    $includeTransactions: Boolean!
    $includeOrders: Boolean!
    $includeUpdates: Boolean!
    $includeHostApplications: Boolean!
    $offset: Int
  ) {
    search(searchTerm: $searchTerm, defaultLimit: $limit, host: $host, account: $account, useTopHits: $useTopHits) {
      results {
        accounts(limit: $limit, offset: $offset) @include(if: $includeAccounts) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchAccountFields
            }
          }
        }
        comments(limit: $limit, offset: $offset) @include(if: $includeComments) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchCommentFields
            }
          }
        }
        expenses(limit: $limit, offset: $offset) @include(if: $includeExpenses) {
          highlights
          collection {
            totalCount
            limit
            offset
            nodes {
              ...SearchExpenseFields
            }
          }
        }
        orders(limit: $limit, offset: $offset) @include(if: $includeOrders) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchOrderFields
            }
          }
        }
        transactions(limit: $limit, offset: $offset) @include(if: $includeTransactions) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchTransactionFields
            }
          }
        }

        updates(limit: $limit, offset: $offset) @include(if: $includeUpdates) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchUpdateFields
            }
          }
        }
        hostApplications(limit: $limit, offset: $offset) @include(if: $includeHostApplications) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchHostApplicationFields
            }
          }
        }
      }
    }
  }
  ${searchCommentFieldsFragment}
  ${searchExpenseFieldsFragment}
  ${searchOrderFieldsFragment}
  ${searchTransactionFieldsFragment}
  ${searchUpdateFieldsFragment}
  ${searchHostApplicationFieldsFragment}
`;

export const searchPageQuery = gql`
  query SearchPage(
    $searchTerm: String!
    $host: AccountReferenceInput
    $account: AccountReferenceInput
    $defaultLimit: Int!
    $accountsLimit: Int
    $commentsLimit: Int
    $expensesLimit: Int
    $ordersLimit: Int
    $updatesLimit: Int
    $transactionsLimit: Int
    $hostApplicationsLimit: Int
    $imageHeight: Int
    $useTopHits: Boolean
    $includeAccounts: Boolean!
    $includeComments: Boolean!
    $includeExpenses: Boolean!
    $includeTransactions: Boolean!
    $includeOrders: Boolean!
    $includeUpdates: Boolean!
    $includeHostApplications: Boolean!
    $offset: Int
  ) {
    search(
      searchTerm: $searchTerm
      defaultLimit: $defaultLimit
      host: $host
      account: $account
      useTopHits: $useTopHits
    ) {
      results {
        accounts(limit: $accountsLimit, offset: $offset) @include(if: $includeAccounts) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchAccountFields
            }
          }
        }
        comments(limit: $commentsLimit, offset: $offset) @include(if: $includeComments) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchCommentFields
            }
          }
        }
        expenses(limit: $expensesLimit, offset: $offset) @include(if: $includeExpenses) {
          highlights
          collection {
            totalCount
            limit
            offset
            nodes {
              ...SearchExpenseFields
            }
          }
        }
        orders(limit: $ordersLimit, offset: $offset) @include(if: $includeOrders) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchOrderFields
            }
          }
        }
        transactions(limit: $transactionsLimit, offset: $offset) @include(if: $includeTransactions) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchTransactionFields
            }
          }
        }

        updates(limit: $updatesLimit, offset: $offset) @include(if: $includeUpdates) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchUpdateFields
            }
          }
        }
        hostApplications(limit: $hostApplicationsLimit, offset: $offset) @include(if: $includeHostApplications) {
          highlights
          collection {
            totalCount
            limit
            nodes {
              ...SearchHostApplicationFields
            }
          }
        }
      }
    }
  }
  ${searchCommentFieldsFragment}
  ${searchExpenseFieldsFragment}
  ${searchOrderFieldsFragment}
  ${searchTransactionFieldsFragment}
  ${searchUpdateFieldsFragment}
  ${searchHostApplicationFieldsFragment}
`;

export const contextQuery = gql`
  query SearchContext($slug: String!) {
    account(slug: $slug) {
      id
      name
      slug
      imageUrl
      type
    }
  }
`;

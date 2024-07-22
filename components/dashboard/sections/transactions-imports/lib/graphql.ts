import { gql } from '@apollo/client';

export const TransactionImportListFieldsFragment = gql`
  fragment TransactionImportListFields on TransactionsImport {
    id
    source
    name
    type
    createdAt
    updatedAt
    stats {
      total
      ignored
      expenses
      orders
      processed
    }
    account {
      ... on Host {
        id
        transactionsImportsSources
      }
    }
  }
`;

export const TransactionsImportRowFieldsFragment = gql`
  fragment TransactionsImportRowFields on TransactionsImportRow {
    id
    sourceId
    isDismissed
    description
    date
    rawValue
    amount {
      valueInCents
      currency
    }
    expense {
      id
      legacyId
      account {
        id
        slug
        name
        type
        imageUrl(height: 48)
      }
    }
    order {
      id
      legacyId
      toAccount {
        id
        slug
        name
        type
        imageUrl(height: 48)
      }
    }
  }
`;

export const updateTransactionsImportRows = gql`
  mutation UpdateTransactionsImportRow($importId: NonEmptyString!, $rows: [TransactionsImportRowUpdateInput!]!) {
    updateTransactionsImportRows(id: $importId, rows: $rows) {
      id
      stats {
        total
        ignored
        expenses
        orders
        processed
      }
      rows {
        totalCount
        offset
        limit
        nodes {
          id
          ...TransactionsImportRowFields
        }
      }
    }
  }
  ${TransactionsImportRowFieldsFragment}
`;

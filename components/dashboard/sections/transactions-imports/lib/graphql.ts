import { gql } from '@apollo/client';

export const TransactionImportListFieldsFragment = gql`
  fragment TransactionImportListFields on TransactionsImport {
    id
    source
    name
    type
    createdAt
    updatedAt
    lastSyncAt
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
    status
    description
    date
    rawValue
    note
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

export const TransactionsImportStatsFragment = gql`
  fragment TransactionsImportStats on TransactionsImportStats {
    total
    ignored
    onHold
    expenses
    orders
    processed
    pending
  }
`;

export const updateTransactionsImportRows = gql`
  mutation UpdateTransactionsImportRow(
    $importId: NonEmptyString!
    $rows: [TransactionsImportRowUpdateInput!]
    $action: TransactionsImportRowAction!
  ) {
    updateTransactionsImportRows(id: $importId, rows: $rows, action: $action) {
      import {
        id
        stats {
          ...TransactionsImportStats
        }
      }
      rows {
        id
        ...TransactionsImportRowFields
      }
    }
  }
  ${TransactionsImportRowFieldsFragment}
  ${TransactionsImportStatsFragment}
`;

export const transactionsImportsQuery = gql`
  query HostTransactionImports($accountSlug: String!, $limit: Int, $offset: Int) {
    host(slug: $accountSlug) {
      id
      transactionsImports(limit: $limit, offset: $offset) {
        totalCount
        limit
        offset
        nodes {
          id
          ...TransactionImportListFields
        }
      }
    }
  }
  ${TransactionImportListFieldsFragment}
`;

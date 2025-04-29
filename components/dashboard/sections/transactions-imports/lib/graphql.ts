import { gql } from '@apollo/client';

export const TransactionsImportStatsFragment = gql`
  fragment TransactionsImportStats on TransactionsImportStats {
    total
    ignored
    onHold
    expenses
    orders
    processed
    pending
    imported
  }
`;

export const TransactionsImportAssignmentFieldsFragment = gql`
  fragment TransactionsImportAssignmentFields on TransactionsImportAssignment {
    importedAccountId
    accounts {
      id
      legacyId
      slug
      type
      name
      legalName
      currency
      imageUrl(height: 32)
    }
  }
`;

export const TransactionImportListFieldsFragment = gql`
  fragment TransactionImportListFields on TransactionsImport {
    id
    source
    name
    type
    createdAt
    updatedAt
    lastSyncAt
    isSyncing
    plaidAccounts {
      accountId
      mask
      name
      officialName
      subtype
      type
    }
    assignments {
      ...TransactionsImportAssignmentFields
    }
    stats {
      ...TransactionsImportStats
    }
    account {
      id
      legacyId
      ... on Host {
        id
        transactionsImportsSources
      }
    }
    connectedAccount {
      id
    }
  }
  ${TransactionsImportStatsFragment}
  ${TransactionsImportAssignmentFieldsFragment}
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
    accountId
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
  mutation UpdateTransactionsImportRow(
    $host: AccountReferenceInput
    $rows: [TransactionsImportRowUpdateInput!]
    $action: TransactionsImportRowAction!
  ) {
    updateTransactionsImportRows(host: $host, rows: $rows, action: $action) {
      host {
        id
        offPlatformTransactionsStats {
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

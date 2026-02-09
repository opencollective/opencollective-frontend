import { gql } from '@apollo/client';

export const transactionsImportStatsFragment = gql`
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

export const transactionsImportAssignmentFieldsFragment = gql`
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

export const transactionImportListFieldsFragment = gql`
  fragment TransactionImportListFields on TransactionsImport {
    id
    source
    name
    type
    createdAt
    updatedAt
    lastSyncAt
    isSyncing
    institutionId
    institutionAccounts {
      id
      name
      type
      subtype
      mask
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
    }
    connectedAccount {
      id
    }
  }
  ${transactionsImportStatsFragment}
  ${transactionsImportAssignmentFieldsFragment}
`;

export const transactionsImportRowFieldsFragment = gql`
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
    assignedAccounts {
      id
      legacyId
      slug
      type
      name
      legalName
      currency
      imageUrl(height: 32)
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

export const updateTransactionsImportRowsMutation = gql`
  mutation UpdateTransactionsImportRow(
    $rows: [TransactionsImportRowUpdateInput!]!
    $action: TransactionsImportRowAction!
  ) {
    updateTransactionsImportRows(rows: $rows, action: $action) {
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
  ${transactionsImportRowFieldsFragment}
  ${transactionsImportStatsFragment}
`;

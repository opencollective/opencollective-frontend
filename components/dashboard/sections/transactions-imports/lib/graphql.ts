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
    amount {
      valueInCents
      currency
    }
    expense {
      id
      legacyId
    }
    order {
      id
      legacyId
    }
  }
`;

import { gql } from '@apollo/client';

import { accountHoverCardFields } from '../../../AccountHoverCard';

const transactionsTableQueryCollectionFragment = gql`
  fragment TransactionsTableQueryCollectionFragment on TransactionCollection {
    totalCount
    offset
    limit
    nodes {
      id
      uuid
      kind
      amount {
        currency
        valueInCents
      }
      netAmount {
        currency
        valueInCents
      }
      group
      type
      description
      createdAt
      isRefunded
      isRefund
      isOrderRejected
      account {
        id
        name
        slug
        isIncognito
        imageUrl
        type
        ...AccountHoverCardFields
      }
      oppositeAccount {
        id
        name
        slug
        isIncognito
        imageUrl
        type
        ...AccountHoverCardFields
      }
      expense {
        id
        type
      }
      permissions {
        id
        canRefund
        canDownloadInvoice
        canReject
      }
    }
  }
  ${accountHoverCardFields}
`;

export const transactionsTableQuery = gql`
  query TransactionsTable(
    $hostAccount: AccountReferenceInput
    $account: [AccountReferenceInput!]
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $paymentMethodType: [PaymentMethodType]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $clearedFrom: DateTime
    $clearedTo: DateTime
    $searchTerm: String
    $kind: [TransactionKind]
    $includeIncognitoTransactions: Boolean
    $includeGiftCardTransactions: Boolean
    $includeChildrenTransactions: Boolean
    $virtualCard: [VirtualCardReferenceInput]
    $orderBy: ChronologicalOrderInput
    $group: String
    $includeHost: Boolean
    $expenseType: [ExpenseType]
    $expense: ExpenseReferenceInput
    $order: OrderReferenceInput
  ) {
    transactions(
      host: $hostAccount
      account: $account
      limit: $limit
      offset: $offset
      type: $type
      paymentMethodType: $paymentMethodType
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      clearedFrom: $clearedFrom
      clearedTo: $clearedTo
      searchTerm: $searchTerm
      kind: $kind
      includeIncognitoTransactions: $includeIncognitoTransactions
      includeGiftCardTransactions: $includeGiftCardTransactions
      includeChildrenTransactions: $includeChildrenTransactions
      includeDebts: true
      virtualCard: $virtualCard
      orderBy: $orderBy
      group: $group
      includeHost: $includeHost
      expenseType: $expenseType
      expense: $expense
      order: $order
    ) {
      ...TransactionsTableQueryCollectionFragment
    }
  }
  ${transactionsTableQueryCollectionFragment}
`;

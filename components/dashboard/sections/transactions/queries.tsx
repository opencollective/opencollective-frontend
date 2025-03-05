import { gql } from '@apollo/client';

import { accountHoverCardFields } from '../../../AccountHoverCard';

const transactionsTableQueryCollectionFragment = gql`
  fragment TransactionsTableQueryCollectionFragment on TransactionCollection {
    totalCount
    offset
    limit
    nodes {
      id
      legacyId
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
      clearedAt
      isRefunded
      isRefund
      isOrderRejected
      isInReview
      isDisputed
      refundTransaction {
        id
        group
      }
      host {
        id
        slug
        legacyId
        type
      }
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
      toAccount {
        id
        slug
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
    $excludeAccount: [AccountReferenceInput!]
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $paymentMethodType: [PaymentMethodType]
    $paymentMethodService: [PaymentMethodService]
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
    $sort: ChronologicalOrderInput
    $group: [String]
    $includeHost: Boolean
    $expenseType: [ExpenseType]
    $expense: ExpenseReferenceInput
    $order: OrderReferenceInput
    $isRefund: Boolean
    $hasDebt: Boolean
    $merchantId: [String]
    $accountingCategory: [String]
    $paymentMethod: [PaymentMethodReferenceInput]
    $payoutMethod: PayoutMethodReferenceInput
  ) {
    transactions(
      host: $hostAccount
      account: $account
      excludeAccount: $excludeAccount
      limit: $limit
      offset: $offset
      type: $type
      paymentMethodType: $paymentMethodType
      paymentMethodService: $paymentMethodService
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
      orderBy: $sort
      group: $group
      includeHost: $includeHost
      expenseType: $expenseType
      expense: $expense
      order: $order
      isRefund: $isRefund
      hasDebt: $hasDebt
      merchantId: $merchantId
      accountingCategory: $accountingCategory
      paymentMethod: $paymentMethod
      payoutMethod: $payoutMethod
    ) {
      ...TransactionsTableQueryCollectionFragment
    }
  }
  ${transactionsTableQueryCollectionFragment}
`;

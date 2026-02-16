import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';
import {
  expenseHostFields,
  expensesListAdminFieldsFragment,
  expensesListFieldsFragment,
} from '../../../expenses/graphql/fragments';

export const accountExpensesQuery = gql`
  query AccountExpenses(
    $account: AccountReferenceInput
    $fromAccount: AccountReferenceInput
    $fromAccounts: [AccountReferenceInput]
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $types: [ExpenseType]
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $payoutMethod: PayoutMethodReferenceInput
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $createdByAccount: AccountReferenceInput
    $includeChildrenExpenses: Boolean
    $fetchHostForExpenses: Boolean!
    $hasAmountInCreatedByAccountCurrency: Boolean!
    $accountingCategory: [String]
    $fetchGrantHistory: Boolean!
  ) {
    expenses(
      account: $account
      fromAccount: $fromAccount
      fromAccounts: $fromAccounts
      limit: $limit
      offset: $offset
      type: $type
      types: $types
      tag: $tags
      status: $status
      amount: $amount
      payoutMethod: $payoutMethod
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      createdByAccount: $createdByAccount
      includeChildrenExpenses: $includeChildrenExpenses
      accountingCategory: $accountingCategory
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        amountInCreatedByAccountCurrency: amountV2(currencySource: CREATED_BY_ACCOUNT)
          @include(if: $hasAmountInCreatedByAccountCurrency) {
          value
          valueInCents
          currency
          exchangeRate {
            date
            value
            source
            isApproximate
            fromCurrency
            toCurrency
          }
        }
        host @include(if: $fetchHostForExpenses) {
          id
          ...ExpenseHostFields
        }

        payee {
          grantHistory: expenses(status: PAID, type: GRANT, direction: SUBMITTED, limit: 1, account: $account)
            @include(if: $fetchGrantHistory) {
            totalAmount {
              amount {
                currency
                valueInCents
              }
            }
            totalCount
          }
        }
      }
    }
  }

  ${expensesListFieldsFragment}
  ${expenseHostFields}
`;

export const accountExpensesMetadataQuery = gql`
  query AccountExpensesMetadata($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      name
      imageUrl
      type
      currency
      childrenAccounts {
        totalCount
        nodes {
          id
          name
          slug
          imageUrl
          currency
          type
          isActive
          isArchived
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...ExpenseHostFields
        }
      }
      ... on Organization {
        isHost
        isActive
        host {
          id
          ...ExpenseHostFields
        }
      }
    }
    expenseTagStats(account: { slug: $accountSlug }) {
      nodes {
        id
        tag
      }
    }
  }
  ${expenseHostFields}
`;

export const hostDashboardExpensesQuery = gql`
  query HostDashboardExpenses(
    $hostSlug: String!
    $hostContext: HostContext
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $types: [ExpenseType]
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $account: AccountReferenceInput
    $fromAccount: AccountReferenceInput
    $fromAccounts: [AccountReferenceInput]
    $lastCommentBy: [LastCommentBy]
    $accountingCategory: [String]
    $fetchGrantHistory: Boolean!
  ) {
    expenses(
      host: { slug: $hostSlug }
      hostContext: $hostContext
      account: $account
      fromAccount: $fromAccount
      fromAccounts: $fromAccounts
      limit: $limit
      offset: $offset
      type: $type
      types: $types
      tag: $tags
      status: $status
      amount: $amount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      lastCommentBy: $lastCommentBy
      accountingCategory: $accountingCategory
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment

        payee {
          grantHistory: expenses(status: PAID, type: GRANT, direction: SUBMITTED, limit: 1, host: { slug: $hostSlug })
            @include(if: $fetchGrantHistory) {
            totalAmount {
              amount {
                currency
                valueInCents
              }
            }
            totalCount
          }
        }
      }
    }
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
    }
  }
  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
`;

export const hostInfoCardFields = gql`
  fragment HostInfoCardFields on Host {
    id
    legacyId
    slug
    currency
    location {
      id
      address
      country
    }
    paypalPreApproval {
      id
      name
      expiryDate
      createdAt
      balance {
        currency
        valueInCents
      }
    }
    transferwise {
      id
      balances {
        valueInCents
        currency
      }
    }
    stripe {
      issuingBalance {
        valueInCents
        currency
      }
    }
    stats {
      id
      balance {
        valueInCents
      }
    }
  }
`;

export const hostDashboardMetadataQuery = gql`
  query HostDashboardMetadata($hostSlug: String!, $hostContext: HostContext) {
    host(slug: $hostSlug) {
      id
      ...HostInfoCardFields
      transferwise {
        id
        availableCurrencies
        amountBatched {
          valueInCents
          currency
        }
      }
    }
    unreplied: expenses(
      host: { slug: $hostSlug }
      hostContext: $hostContext
      status: [APPROVED, ERROR, INCOMPLETE, ON_HOLD]
      lastCommentBy: [NON_HOST_ADMIN]
    ) {
      totalCount
    }
    ready_to_pay: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [READY_TO_PAY]) {
      totalCount
    }
    scheduled_for_payment: expenses(
      host: { slug: $hostSlug }
      hostContext: $hostContext
      status: [SCHEDULED_FOR_PAYMENT]
    ) {
      totalCount
    }
    on_hold: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [ON_HOLD]) {
      totalCount
    }
    incomplete: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [INCOMPLETE]) {
      totalCount
    }
    error: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [ERROR]) {
      totalCount
    }
  }
  ${hostInfoCardFields}
`;

/**
 * Query for the Payment Requests page - fetches counts for all, pending, paid, and rejected expenses
 */
export const paymentRequestsMetadataQuery = gql`
  query PaymentRequestsMetadata($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      slug
      name
      imageUrl
      type
      currency
      childrenAccounts {
        totalCount
        nodes {
          id
          name
          slug
          imageUrl
          currency
          type
          isActive
          isArchived
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...ExpenseHostFields
        }
      }
      ... on Organization {
        isHost
        isActive
        host {
          id
          ...ExpenseHostFields
        }
      }
    }
    expenseTagStats(account: { slug: $accountSlug }) {
      nodes {
        id
        tag
      }
    }
    all: expenses(account: { slug: $accountSlug }, includeChildrenExpenses: true) {
      totalCount
    }
    pending: expenses(account: { slug: $accountSlug }, includeChildrenExpenses: true, status: [PENDING]) {
      totalCount
    }
    paid: expenses(account: { slug: $accountSlug }, includeChildrenExpenses: true, status: [PAID]) {
      totalCount
    }
    rejected: expenses(account: { slug: $accountSlug }, includeChildrenExpenses: true, status: [REJECTED]) {
      totalCount
    }
  }
  ${expenseHostFields}
`;

/**
 * Metadata query for the Paid Disbursements page - fetches counts for all, invoices, reimbursements, and grants
 */
export const paidDisbursementsMetadataQuery = gql`
  query PaidDisbursementsMetadata($hostSlug: String!, $hostContext: HostContext) {
    host(slug: $hostSlug) {
      id
      slug
      currency
    }
    ALL: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PAID]) {
      totalCount
    }
    INVOICES: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PAID], types: [INVOICE]) {
      totalCount
    }
    REIMBURSEMENTS: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PAID], types: [RECEIPT]) {
      totalCount
    }
    GRANTS: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PAID], types: [GRANT]) {
      totalCount
    }
  }
`;

/**
 * Metadata query for Host Payment Requests page - fetches counts by expense status
 */
export const hostPaymentRequestsMetadataQuery = gql`
  query HostPaymentRequestsMetadata($hostSlug: String!, $hostContext: HostContext) {
    host(slug: $hostSlug) {
      id
      slug
      currency
    }
    all: expenses(host: { slug: $hostSlug }, hostContext: $hostContext) {
      totalCount
    }
    pending: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PENDING, UNVERIFIED]) {
      totalCount
    }
    approved: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [APPROVED]) {
      totalCount
    }
    rejected: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [REJECTED]) {
      totalCount
    }
    paid: expenses(host: { slug: $hostSlug }, hostContext: $hostContext, status: [PAID]) {
      totalCount
    }
  }
`;

export const paidDisbursementsQuery = gql`
  query PaidDisbursements(
    $hostSlug: String!
    $hostContext: HostContext
    $limit: Int!
    $offset: Int!
    $types: [ExpenseType]
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $account: AccountReferenceInput
    $accountingCategory: [String]
    $fromAccounts: [AccountReferenceInput]
  ) {
    expenses(
      host: { slug: $hostSlug }
      hostContext: $hostContext
      account: $account
      limit: $limit
      offset: $offset
      types: $types
      tag: $tags
      status: $status
      amount: $amount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      accountingCategory: $accountingCategory
      fromAccounts: $fromAccounts
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment
        paidAt
        paidBy {
          id
          slug
          name
          type
          imageUrl
          ...AccountHoverCardFields
        }
      }
    }
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
    }
  }
  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${accountHoverCardFields}
  ${expenseHostFields}
`;

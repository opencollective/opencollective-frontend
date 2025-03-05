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
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $minAmount: Int
    $maxAmount: Int
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
  ) {
    expenses(
      account: $account
      fromAccount: $fromAccount
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
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
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $account: AccountReferenceInput
    $lastCommentBy: [LastCommentBy]
    $accountingCategory: [String]
  ) {
    expenses(
      host: { slug: $hostSlug }
      account: $account
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
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

const hostInfoCardFields = gql`
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
  query HostDashboardMetadata($hostSlug: String!) {
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
      status: [APPROVED, ERROR, INCOMPLETE, ON_HOLD]
      lastCommentBy: [NON_HOST_ADMIN]
    ) {
      totalCount
    }
    ready_to_pay: expenses(host: { slug: $hostSlug }, status: [READY_TO_PAY]) {
      totalCount
    }
    scheduled_for_payment: expenses(host: { slug: $hostSlug }, status: [SCHEDULED_FOR_PAYMENT]) {
      totalCount
    }
    on_hold: expenses(host: { slug: $hostSlug }, status: [ON_HOLD]) {
      totalCount
    }
    incomplete: expenses(host: { slug: $hostSlug }, status: [INCOMPLETE]) {
      totalCount
    }
    error: expenses(host: { slug: $hostSlug }, status: [ERROR]) {
      totalCount
    }

    hostedAccounts: accounts(host: { slug: $hostSlug }, orderBy: { field: ACTIVITY, direction: DESC }) {
      nodes {
        id
        ...AccountHoverCardFields
      }
    }

    expenseTags: expenseTagStats(host: { slug: $hostSlug }) {
      nodes {
        id
        tag
      }
    }
  }

  ${accountHoverCardFields}
  ${hostInfoCardFields}
`;

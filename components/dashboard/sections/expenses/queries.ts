import { gql } from '@apollo/client';

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
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $createdByAccount: AccountReferenceInput
    $includeChildrenExpenses: Boolean
    $fetchHostForExpenses: Boolean!
    $hasAmountInCreatedByAccountCurrency: Boolean!
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
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $orderBy
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      createdByAccount: $createdByAccount
      includeChildrenExpenses: $includeChildrenExpenses
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
  query AccountExpensesMetadataQuery($accountSlug: String!) {
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
        # We add that for hasFeature
        isHost
        isActive
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
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $account: AccountReferenceInput
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
      orderBy: $orderBy
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
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
  }

  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
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
  query HostDashboardMetadata($hostSlug: String!, $getViewCounts: Boolean!) {
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
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
    all: expenses(host: { slug: $hostSlug }, limit: 0) @include(if: $getViewCounts) {
      totalCount
    }
    ready_to_pay: expenses(host: { slug: $hostSlug }, limit: 0, status: READY_TO_PAY) @include(if: $getViewCounts) {
      totalCount
    }
    scheduled_for_payment: expenses(
      host: { slug: $hostSlug }
      limit: 0
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
    ) @include(if: $getViewCounts) {
      totalCount
    }
    on_hold: expenses(host: { slug: $hostSlug }, limit: 0, status: ON_HOLD) @include(if: $getViewCounts) {
      totalCount
    }
    incomplete: expenses(host: { slug: $hostSlug }, limit: 0, status: INCOMPLETE) @include(if: $getViewCounts) {
      totalCount
    }
    error: expenses(host: { slug: $hostSlug }, limit: 0, status: ERROR) @include(if: $getViewCounts) {
      totalCount
    }
    paid: expenses(host: { slug: $hostSlug }, limit: 0, status: PAID) @include(if: $getViewCounts) {
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
  ${expenseHostFields}
  ${hostInfoCardFields}
`;

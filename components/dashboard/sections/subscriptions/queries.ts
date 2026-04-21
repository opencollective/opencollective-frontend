import { gql } from '@/lib/graphql/helpers';

import { accountHoverCardFields } from '@/components/AccountHoverCard';

export const planFeatures = gql`
  fragment PlanFeatures on PlatformSubscriptionFeatures {
    TRANSFERWISE
    PAYPAL_PAYOUTS
    RECEIVE_HOST_APPLICATIONS
    CHART_OF_ACCOUNTS
    EXPENSE_SECURITY_CHECKS
    EXPECTED_FUNDS
    CHARGE_HOSTING_FEES
    AGREEMENTS
    TAX_FORMS
    OFF_PLATFORM_TRANSACTIONS
    FUNDS_GRANTS_MANAGEMENT
    VENDORS
    USE_EXPENSES
    UPDATES
    RECEIVE_FINANCIAL_CONTRIBUTIONS
    RECEIVE_EXPENSES
    RECEIVE_GRANTS
    ACCOUNT_MANAGEMENT
  }
`;

const fields = gql`
  fragment SubscriberFields on Account {
    id
    name
    slug
    type
    currency
    imageUrl(height: 96)
    isFrozen
    isHost
    tags
    settings
    createdAt
    childrenAccounts {
      nodes {
        id
        slug
        name
        type
        members(role: [ADMIN]) {
          nodes {
            id
            account {
              id
              ...AccountHoverCardFields
              emails
            }
          }
        }
      }
    }
    members(role: [ADMIN]) {
      nodes {
        id
        account {
          id
          ...AccountHoverCardFields
          emails
        }
      }
    }
    stats {
      managedAmount {
        valueInCents
        currency
      }
    }
    transactions(limit: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        id
        createdAt
      }
    }
    ... on AccountWithParent {
      parent {
        id
        slug
        name
        ...AccountHoverCardFields
      }
    }
    ... on AccountWithPlatformSubscription {
      legacyPlan {
        name
      }
      platformSubscription {
        startDate
        plan {
          title
          type
          basePlanId
          features {
            ...PlanFeatures
          }
          pricing {
            pricePerMonth {
              valueInCents
              currency
            }
            pricePerAdditionalCollective {
              valueInCents
              currency
            }
            pricePerAdditionalExpense {
              valueInCents
              currency
            }
            includedCollectives
            includedExpensesPerMonth
          }
        }
      }
    }
  }
  ${planFeatures}
  ${accountHoverCardFields}
`;

export const subscribersQuery = gql`
  query Subscribers(
    $limit: Int!
    $offset: Int!
    $sort: OrderByInput
    $searchTerm: String
    $type: [AccountType]
    $isVerified: Boolean
    $isFirstPartyHost: Boolean
    $isPlatformSubscriber: Boolean
    $plan: [String]
    $lastTransactionFrom: DateTime
    $lastTransactionTo: DateTime
  ) {
    accounts(
      limit: $limit
      offset: $offset
      searchTerm: $searchTerm
      type: $type
      orderBy: $sort
      skipGuests: true
      isPlatformSubscriber: $isPlatformSubscriber
      plan: $plan
      isVerified: $isVerified
      isFirstPartyHost: $isFirstPartyHost
      lastTransactionFrom: $lastTransactionFrom
      lastTransactionTo: $lastTransactionTo
    ) {
      offset
      limit
      totalCount
      nodes {
        id
        slug
        name
        type
        ...SubscriberFields
      }
    }
  }
  ${fields}
`;

export const availablePlansQuery = gql`
  query Plans {
    platformSubscriptionTiers {
      id
      title
      type
      pricing {
        pricePerMonth {
          valueInCents
          currency
        }
        pricePerAdditionalCollective {
          valueInCents
          currency
        }
        pricePerAdditionalExpense {
          valueInCents
          currency
        }
        includedCollectives
        includedExpensesPerMonth
      }
      features {
        ...PlanFeatures
      }
    }
  }
  ${planFeatures}
`;

export const updateAccountPlatformSubscriptionMutation = gql`
  mutation UpdateAccountPlatformSubscription(
    $account: AccountReferenceInput!
    $subscription: PlatformSubscriptionInput!
  ) {
    updateAccountPlatformSubscription(account: $account, subscription: $subscription) {
      id
      slug
      name
      type
      ...SubscriberFields
    }
  }
  ${fields}
`;

export const subscriberDrawerQuery = gql`
  query SubscriberDrawer($id: String!) {
    account(id: $id) {
      id
      slug
      ...SubscriberFields
      stats {
        balance {
          valueInCents
          currency
        }
      }
      expenses(type: PLATFORM_BILLING, direction: RECEIVED, limit: 6, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          id
          legacyId
          createdAt
          description
          amount: amountV2 {
            valueInCents
            currency
          }
          account {
            slug
          }
          type
          status
          platformBillingData
        }
      }
    }
  }

  ${fields}
`;

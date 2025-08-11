import { gql } from '@/lib/graphql/helpers';

import { accountHoverCardFields } from '@/components/AccountHoverCard';

const fields = gql`
  fragment SubscriberFields on Account {
    id
    legacyId
    name
    slug
    website
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
    }
  }
  ${accountHoverCardFields}
`;

export const subscribersQuery = gql`
  query Subscribers(
    $limit: Int!
    $offset: Int!
    $sort: OrderByInput
    $searchTerm: String
    $type: [AccountType]
    $isHost: Boolean
    $host: [AccountReferenceInput]
    $isActive: Boolean
    $consolidatedBalance: AmountRangeInput
    $isVerified: Boolean
    $isFirstPartyHost: Boolean
  ) {
    accounts(
      limit: $limit
      offset: $offset
      searchTerm: $searchTerm
      type: $type
      orderBy: $sort
      isHost: $isHost
      isActive: $isActive
      host: $host
      consolidatedBalance: $consolidatedBalance
      skipGuests: true
      isSubscriber: true
      plan: ["LEGACY"]
      isVerified: $isVerified
      isFirstPartyHost: $isFirstPartyHost
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

export const updateAccountPlaformSubscriptionMutation = gql`
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

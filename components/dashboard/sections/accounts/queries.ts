import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

const dashboardAccountsQueryFields = gql`
  fragment DashboardAccountsQueryFields on Account {
    id
    legacyId
    name
    slug
    type
    currency
    imageUrl(height: 96)
    isFrozen
    isActive
    isHost
    tags
    settings
    createdAt
    stats {
      id
      balance {
        valueInCents
        currency
      }
      totalAmountSpent {
        valueInCents
        currency
      }
      totalAmountReceived {
        valueInCents
        currency
      }
    }
    paymentMethods(service: OPENCOLLECTIVE, type: COLLECTIVE) {
      id
      service
      name
    }
  }
`;

export const accountsMetadataQuery = gql`
  query AccountsDashboardMetadata($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      isActive
      isArchived
      all: childrenAccounts(limit: 1) {
        totalCount
      }
      active: childrenAccounts(limit: 1, isActive: true) {
        totalCount
      }
      archived: childrenAccounts(limit: 1, isActive: false) {
        totalCount
      }
    }
  }
`;

// TODO: This query is using `legacyId` for host and member.account to interface with the
// legacy `AddFundsForm`. Once the new add funds form will be implemented, we can remove these fields.
export const accountsQuery = gql`
  query AccountsDashboard($accountSlug: String!, $limit: Int!, $offset: Int!, $isActive: Boolean) {
    account(slug: $accountSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      type
      settings
      ...DashboardAccountsQueryFields
      stats {
        id
        consolidatedBalance {
          valueInCents
          currency
        }
      }
      childrenAccounts(limit: $limit, offset: $offset, isActive: $isActive) {
        totalCount
        nodes {
          id
          ...DashboardAccountsQueryFields
        }
      }
    }
  }

  ${dashboardAccountsQueryFields}
`;

export const accountDetailQuery = gql`
  query HostedAccountDetail($id: String!) {
    account(id: $id) {
      ...DashboardAccountsQueryFields
      id
      legacyId
      slug
      name
      currency
      isHost
      type
      settings
      ... on AccountWithParent {
        parent {
          id
        }
      }
      stats {
        id
        consolidatedBalance {
          valueInCents
          currency
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
      transactions(limit: 10, offset: 0, kind: [ADDED_FUNDS, CONTRIBUTION, EXPENSE]) {
        nodes {
          id
          clearedAt
          createdAt
          type
          kind
          description
          isRefund
          isRefunded
          isInReview
          isDisputed
          isOrderRejected
          amount {
            valueInCents
            currency
          }
          netAmount {
            valueInCents
            currency
          }
          oppositeAccount {
            id
            slug
            name
            imageUrl
          }
        }
      }
    }
    activities(account: { id: $id }, limit: 5, offset: 0, type: [COLLECTIVE]) {
      nodes {
        id
        type
        createdAt
        data
        isSystem
        account {
          id
          slug
          name
          imageUrl
        }
        fromAccount {
          id
          slug
          name
          imageUrl
        }
        individual {
          id
          slug
          name
          imageUrl
        }
      }
    }
  }

  ${accountHoverCardFields}
  ${dashboardAccountsQueryFields}
`;

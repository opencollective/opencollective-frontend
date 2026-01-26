import { gql } from '@apollo/client';

import { accountHoverCardFields } from '@/components/AccountHoverCard';

/**
 * Platform-wide people/community query for root users.
 * Does not require a host context - returns all community members platform-wide.
 * Can optionally filter by host for scoped results.
 */
export const peoplePlatformDashboardQuery = gql`
  query PeoplePlatformDashboard(
    $offset: Int
    $limit: Int
    $relation: [CommunityRelationType!]
    $searchTerm: String
    $host: AccountReferenceInput
  ) {
    community(
      host: $host
      relation: $relation
      type: [INDIVIDUAL]
      searchTerm: $searchTerm
      offset: $offset
      limit: $limit
    ) {
      totalCount
      limit
      offset
      nodes {
        id
        legacyId
        slug
        name
        legalName
        type
        imageUrl
        isIncognito
        ... on Individual {
          isGuest
          email
          location {
            country
          }
        }
      }
    }
  }
`;

/**
 * Query for fetching account details at platform level.
 * Does not require host context for basic account information.
 */
export const platformAccountDetailQuery = gql`
  query PlatformAccountDetail($accountId: String!) {
    account(id: $accountId) {
      id
      legacyId
      slug
      name
      legalName
      type
      createdAt
      imageUrl
      socialLinks {
        type
        url
      }
      location {
        id
        country
        address
      }
      isVerified
      ... on Individual {
        email
      }
      members(role: [ADMIN, ACCOUNTANT, MEMBER, COMMUNITY_MANAGER]) {
        nodes {
          id
          role
          description
          createdAt
          account {
            id
            ...AccountHoverCardFields
          }
        }
      }
      memberOf {
        nodes {
          id
          role
          account {
            id
            type
            ...AccountHoverCardFields
            ... on AccountWithHost {
              host {
                id
                slug
                name
                type
                imageUrl
              }
            }
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

/**
 * Query for fetching hosts that an account has interacted with.
 * Used in platform-level detail view to show which hosts the person is associated with.
 */
export const platformAccountHostsQuery = gql`
  query PlatformAccountHosts($accountId: String!) {
    account(id: $accountId) {
      id
      memberOf(accountType: [COLLECTIVE, FUND, EVENT, PROJECT]) {
        nodes {
          id
          role
          account {
            id
            slug
            name
            type
            ... on AccountWithHost {
              host {
                id
                slug
                name
                type
                imageUrl
              }
            }
          }
        }
      }
    }
  }
`;

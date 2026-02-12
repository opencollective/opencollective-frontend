import { graphql } from '@apollo/client/react/hoc';

import { collectiveNavbarFieldsFragment } from '../../components/collective-page/graphql/fragments';

import { gql } from './helpers';

const collectiveNavbarQuery = gql`
  query CollectiveNavbar($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      imageUrl(height: 256)
      ... on Event {
        parent {
          id
          slug
        }
      }
      ... on Project {
        parent {
          id
          slug
        }
      }
      features {
        id
        ...NavbarFieldsV1
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const addCollectiveNavbarData = component => {
  return graphql(collectiveNavbarQuery)(component);
};

const loggedInUserWorkspaceFieldsFragment = gql /* GraphQL */ `
  fragment LoggedInUserWorkspaceFields on Account {
    id
    legacyId
    slug
    type
    name
    imageUrl
    currency
    isHost
    isIncognito
    isArchived
    settings
    categories
    policies {
      id
      REQUIRE_2FA_FOR_ADMINS
    }
    features {
      id
      VIRTUAL_CARDS
      USE_PAYMENT_METHODS
      EMIT_GIFT_CARDS
      OFF_PLATFORM_TRANSACTIONS
      TAX_FORMS
      AGREEMENTS
      KYC
    }
    supportedExpenseTypes
    ... on AccountWithParent {
      parent {
        id
        legacyId
        slug
        policies {
          id
          REQUIRE_2FA_FOR_ADMINS
        }
      }
    }
    ... on AccountWithHost {
      isApproved
      host {
        id
        slug
        requiredLegalDocuments
        settings
      }
    }
    ... on AccountWithPlatformSubscription {
      platformSubscription {
        plan {
          title
        }
      }
    }
    ... on Organization {
      hasHosting
      hasMoneyManagement
    }
    ... on Event {
      endsAt
    }
    childrenAccounts {
      nodes {
        id
        legacyId
        slug
        type
        name
        isActive
        isArchived
        imageUrl
        ... on AccountWithHost {
          host {
            id
          }
        }
      }
    }
    location {
      id
      address
      country
      structured
    }
  }
`;

/**
 * GraphQL v2 query to fetch the currently logged-in user (Individual account).
 * This replaces the v1 `loggedInUserQuery` that used the deprecated `LoggedInUser` root field.
 */
export const loggedInUserQuery = gql /* GraphQL */ `
  query LoggedInUser {
    loggedInAccount {
      id
      legacyId
      slug
      name
      legalName
      type
      imageUrl
      email
      isLimited
      isRoot
      hasSeenLatestChangelogEntry
      hasTwoFactorAuth
      hasPassword
      requiresProfileCompletion
      settings
      currency
      categories
      location {
        id
        address
        country
        structured
      }
      memberOf(limit: 1000) {
        nodes {
          id
          role
          account {
            id
            legacyId
            slug
            type
            name
            isHost
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
            ... on AccountWithHost {
              host {
                id
              }
            }
            ... on Organization {
              hasHosting
            }
          }
        }
      }
      workspaces {
        ...LoggedInUserWorkspaceFields
      }
    }
  }
  ${loggedInUserWorkspaceFieldsFragment}
`;

/**
 * Subset query for the changelog trigger component. Reads from the Apollo cache
 * populated by the main `loggedInUserQuery`.
 */
export const changelogTriggerLoggedInUserQuery = gql /* GraphQL */ `
  query ChangelogTriggerLoggedInUser {
    loggedInAccount {
      id
      hasSeenLatestChangelogEntry
    }
  }
`;

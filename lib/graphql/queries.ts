import { graphql } from '@apollo/client/react/hoc';

import { gql } from './helpers';

const workspaceSubFieldsFragment = gql`
  fragment WorkspaceSubFields on Account {
    id
    legacyId
    slug
    type
    name
    imageUrl
    currency
    isHost
    isIncognito
    isPrivate
    isArchived
    isActive
    settings
    categories
    createdAt
    canHaveChangelogUpdates
    policies {
      id
      publicId
      REQUIRE_2FA_FOR_ADMINS
      USE_VENDOR_POLICY
    }
    features {
      id
      USE_PAYMENT_METHODS
      EMIT_GIFT_CARDS
      RECEIVE_GRANTS
      RECEIVE_FINANCIAL_CONTRIBUTIONS
      RECEIVE_HOST_APPLICATIONS
      UPDATES
      COLLECTIVE_GOALS
      PUBLIC_PROFILE
      VIRTUAL_CARDS
      ACCOUNTING_CATEGORIZATION_RULES
    }
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
      host {
        id
        slug
        requiredLegalDocuments
      }
      features {
        id
        OFF_PLATFORM_TRANSACTIONS
        TAX_FORMS
        AGREEMENTS
        KYC
      }
    }
    ... on Event {
      endsAt
    }
  }
`;

const loggedInUserWorkspaceFieldsFragment = gql`
  fragment LoggedInUserWorkspaceFields on Account {
    id
    ...WorkspaceSubFields
    childrenAccounts {
      nodes {
        ...WorkspaceSubFields
      }
    }
  }
  ${workspaceSubFieldsFragment}
`;

/**
 * GraphQL v2 query to fetch the currently logged-in user (Individual account).
 * This replaces the v1 `loggedInUserQuery` that used the deprecated `LoggedInUser` root field.
 */
export const loggedInUserQuery = gql`
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
      ...WorkspaceSubFields
      workspaces: memberOf(role: [ADMIN, ACCOUNTANT, COMMUNITY_MANAGER], limit: 1000) {
        nodes {
          id
          role
          account {
            ...LoggedInUserWorkspaceFields
          }
        }
      }
      memberOf(limit: 1000) {
        nodes {
          id
          role
          account {
            id
            slug
          }
        }
      }
    }
  }
  ${loggedInUserWorkspaceFieldsFragment}
`;

const collectiveNavbarFieldsFragment = gql`
  fragment NavbarFieldsV1 on CollectiveFeatures {
    id
    ABOUT
    CONNECTED_ACCOUNTS
    RECEIVE_FINANCIAL_CONTRIBUTIONS
    RECURRING_CONTRIBUTIONS
    EVENTS
    PROJECTS
    USE_EXPENSES
    RECEIVE_EXPENSES
    COLLECTIVE_GOALS
    TOP_FINANCIAL_CONTRIBUTORS
    CONVERSATIONS
    UPDATES
    TEAM
    CONTACT_FORM
    RECEIVE_HOST_APPLICATIONS
    HOST_DASHBOARD
    TRANSACTIONS
  }
`;

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

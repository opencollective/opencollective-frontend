import { graphql } from '@apollo/client/react/hoc';

import { gql } from './helpers';

const loggedInUserMembershipAccountFieldsFragment = gql`
  fragment LoggedInUserMembershipAccountFields on Account {
    id
    legacyId
    slug
    type
    name
    imageUrl
    currency
    isIncognito
    isPrivate
    isHost
    isArchived
    isActive
    categories
    settings
    features {
      id
      PUBLIC_PROFILE
    }
    policies {
      id
      REQUIRE_2FA_FOR_ADMINS
    }
    location {
      id
      address
      country
      structured
    }
    childrenAccounts(limit: 100) {
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
            slug
          }
        }
      }
    }
    ... on AccountWithParent {
      parent {
        id
        legacyId
        policies {
          id
          REQUIRE_2FA_FOR_ADMINS
        }
      }
    }
    ... on AccountWithHost {
      host {
        id
        slug
      }
    }
    ... on Organization {
      hasHosting
      hasMoneyManagement
      host {
        id
        slug
      }
    }
    ... on Event {
      endsAt
    }
  }
`;

/**
 * GraphQL v2 query to fetch the currently logged-in user (Individual account).
 * This replaces the v1 `loggedInUserQuery` that used the deprecated `LoggedInUser` root field,
 * fetching the equivalent data (profile + memberships) from the v2 API.
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
      memberOf(limit: 1000) {
        nodes {
          id
          role
          account {
            ...LoggedInUserMembershipAccountFields
          }
        }
      }
    }
  }
  ${loggedInUserMembershipAccountFieldsFragment}
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

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
            isIncognito
            name
            currency
            isHost
            imageUrl
            categories
            isArchived
            policies {
              id
              REQUIRE_2FA_FOR_ADMINS
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
              }
            }
            ... on Organization {
              hasHosting
            }
            ... on Event {
              endsAt
            }
            settings
            location {
              id
              address
              country
              structured
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
          }
        }
      }
    }
  }
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

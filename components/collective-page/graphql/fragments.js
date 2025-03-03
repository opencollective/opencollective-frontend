import { gqlV1 } from '../../../lib/graphql/helpers';

/**
 * Fields fetched for contributors
 */
export const contributorsFieldsFragment = gqlV1/* GraphQL */ `
  fragment ContributorsFields on Contributor {
    id
    name
    roles
    isAdmin
    isCore
    isBacker
    since
    image
    description
    collectiveSlug
    totalAmountDonated
    type
    publicMessage
    isIncognito
    isGuest
    tiersIds
    collectiveId
  }
`;

/**
 * Fields fetched for all possible collective page features
 */
export const collectiveNavbarFieldsFragment = gqlV1/* GraphQL */ `
  fragment NavbarFields on CollectiveFeatures {
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

const contributeCardContributorFieldsFragment = gqlV1/* GraphQL */ `
  fragment ContributeCardContributorFields on Contributor {
    id
    image(height: 64)
    collectiveSlug
    name
    type
    isGuest
  }
`;

export const contributeCardTierFieldsFragment = gqlV1/* GraphQL */ `
  fragment ContributeCardTierFields on Tier {
    id
    name
    slug
    description
    useStandalonePage
    goal
    interval
    currency
    amount
    minimumAmount
    button
    amountType
    endsAt
    type
    maxQuantity
    stats {
      id
      availableQuantity
      totalDonated
      totalRecurringDonations
      contributors {
        id
        all
        users
        organizations
      }
    }
    contributors(limit: $nbContributorsPerContributeCard) {
      id
      ...ContributeCardContributorFields
    }
  }
  ${contributeCardContributorFieldsFragment}
`;

export const contributeCardEventFieldsFragment = gqlV1/* GraphQL */ `
  fragment ContributeCardEventFields on Event {
    id
    slug
    name
    description
    image
    isActive
    startsAt
    endsAt
    backgroundImageUrl(height: 208)
    tiers {
      id
      type
    }
    contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER, ATTENDEE]) {
      id
      ...ContributeCardContributorFields
    }
    stats {
      id
      backers {
        id
        all
        users
        organizations
      }
    }
  }
  ${contributeCardContributorFieldsFragment}
`;

export const contributeCardProjectFieldsFragment = gqlV1/* GraphQL */ `
  fragment ContributeCardProjectFields on Project {
    id
    slug
    name
    description
    image
    isActive
    isArchived
    backgroundImageUrl(height: 208)
    contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER]) {
      id
      ...ContributeCardContributorFields
    }
    stats {
      id
      backers {
        id
        all
        users
        organizations
      }
    }
  }
  ${contributeCardContributorFieldsFragment}
`;

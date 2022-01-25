import { gql } from '@apollo/client';

/**
 * Fields fetched for updates
 */
export const updatesFieldsFragment = gql`
  fragment UpdatesFields on UpdateType {
    id
    slug
    title
    summary
    createdAt
    publishedAt
    isPrivate
    userCanSeeUpdate
    fromCollective {
      id
      type
      name
      slug
      imageUrl
    }
  }
`;

/**
 * Fields fetched for contributors
 */
export const contributorsFieldsFragment = gql`
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
export const collectiveNavbarFieldsFragment = gql`
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
    USE_EXPENSES
    COLLECTIVE_GOALS
    TOP_FINANCIAL_CONTRIBUTORS
    CONVERSATIONS
    UPDATES
    TEAM
    CONTACT_FORM
    RECEIVE_HOST_APPLICATIONS
    HOST_DASHBOARD
    TRANSACTIONS
    REQUEST_VIRTUAL_CARDS
  }
`;

const contributeCardContributorFieldsFragment = gql`
  fragment ContributeCardContributorFields on Contributor {
    id
    image(height: 64)
    collectiveSlug
    name
    type
    isGuest
  }
`;

export const contributeCardTierFieldsFragment = gql`
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
      ...ContributeCardContributorFields
    }
  }
  ${contributeCardContributorFieldsFragment}
`;

export const contributeCardEventFieldsFragment = gql`
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

export const contributeCardProjectFieldsFragment = gql`
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

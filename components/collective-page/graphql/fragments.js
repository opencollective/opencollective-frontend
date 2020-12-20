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
  }
`;

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

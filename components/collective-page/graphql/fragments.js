import gql from 'graphql-tag';

/**
 * Fields fetched for updates
 */
export const updatesFieldsFragment = gql`
  fragment UpdatesFieldsFragment on UpdateType {
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
  fragment ContributorsFieldsFragment on Contributor {
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
    tiersIds
    collectiveId
  }
`;

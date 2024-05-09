import { gql } from '@apollo/client';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

export const updateFieldsFragment = gql`
  fragment UpdateFields on Update {
    id
    title
    slug
    isPrivate
    isChangelog
    createdAt
    publishedAt
    updatedAt
    makePublicOn
    notificationAudience
    userCanSeeUpdate
    summary
    tags
    fromAccount {
      id
      slug
      name
      imageUrl
      type
    }
    account {
      id
      slug
      name
      imageUrl
      type
    }
    reactions
    userReactions
  }
`;

export const updatesDashboardQuery = gql`
  query UpdatesDashboard(
    $slug: String
    $limit: Int
    $offset: Int
    $isDraft: Boolean
    $onlyPublishedUpdates: Boolean
    $searchTerm: String
  ) {
    account(slug: $slug) {
      id
      updates(
        limit: $limit
        offset: $offset
        isDraft: $isDraft
        onlyPublishedUpdates: $onlyPublishedUpdates
        searchTerm: $searchTerm
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          ...UpdateFields
          comments(limit: 10) {
            totalCount
            nodes {
              id
              createdAt
              fromAccount {
                id
                slug
                name
                imageUrl
                type
              }
              reactions
              userReactions
              html
            }
          }
        }
      }
    }
  }
  ${updateFieldsFragment}
`;

export const updatesDashboardMetadataQuery = gql`
  query UpdatesDashboardMetadata($slug: String) {
    account(slug: $slug) {
      id
      PUBLISHED: updates(onlyPublishedUpdates: true) {
        totalCount
      }
      DRAFTS: updates(isDraft: true) {
        totalCount
      }
    }
  }
`;

export const updatesViewQuery = gql`
  query UpdateView($id: String!, $commentOffset: Int) {
    update(id: $id) {
      id
      html
      ...UpdateFields
      comments(limit: 20, offset: $commentOffset) {
        totalCount
        nodes {
          id
          createdAt
          fromAccount {
            id
            slug
            name
            imageUrl
            type
          }
          reactions
          userReactions
          html
        }
      }
    }
  }
  ${updateFieldsFragment}
`;

export const getRefetchQueries = account => [
  {
    query: updatesDashboardQuery,
    variables: {
      slug: account.slug,
      limit: 10,
      offset: 0,
      onlyPublishedUpdates: true,
      orderBy: 'CREATED_AT,DESC',
    },
    context: API_V2_CONTEXT,
  },
  {
    query: updatesDashboardQuery,
    variables: {
      slug: account.slug,
      limit: 10,
      offset: 0,
      isDraft: true,
      orderBy: 'CREATED_AT,DESC',
    },
    context: API_V2_CONTEXT,
  },
  { query: updatesDashboardMetadataQuery, variables: { slug: account.slug }, context: API_V2_CONTEXT },
];

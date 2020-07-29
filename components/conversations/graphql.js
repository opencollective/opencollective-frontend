import gql from 'graphql-tag';

const gqlV2 = gql;

export const commentFieldsFragment = gqlV2/* GraphQL */ `
  fragment CommentFields on Comment {
    id
    createdAt
    html
    reactions
    userReactions
    fromCollective {
      id
      type
      name
      slug
      imageUrl
    }
  }
`;

export const conversationListFragment = gqlV2/* GraphQL */ `
  fragment ConversationListFragment on ConversationCollection {
    totalCount
    offset
    limit
    nodes {
      id
      title
      summary
      slug
      createdAt
      tags
      fromCollective {
        id
        name
        type
        slug
        imageUrl
      }
      followers(limit: 5) {
        totalCount
        nodes {
          id
          slug
          type
          name
          imageUrl(height: 64)
        }
      }
      stats {
        id
        commentsCount
      }
    }
  }
`;

export const isUserFollowingConversationQuery = gqlV2/* GraphQL */ `
  query IsUserFollowingConversation($id: String!) {
    loggedInAccount {
      id
      slug
      imageUrl
      type
      name
      ... on Individual {
        isFollowingConversation(id: $id)
      }
    }
  }
`;

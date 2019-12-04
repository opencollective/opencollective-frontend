import gql from 'graphql-tag';

const gqlV2 = gql;
export const CommentFieldsFragment = gqlV2`
  fragment CommentFields on Comment {
    id
    createdAt
    html
    fromCollective {
      id
      type
      name
      slug
      imageUrl
    }
  }
`;

export const ConversationListFragment = gqlV2`
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

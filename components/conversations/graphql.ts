import { gql } from '../../lib/graphql/helpers';

import { accountHoverCardFields } from '../AccountHoverCard';

export const commentFieldsFragment = gql`
  fragment CommentFields on Comment {
    id
    createdAt
    html
    reactions
    userReactions
    type
    account {
      id
      slug
      ... on AccountWithHost {
        host {
          id
          slug
        }
      }
    }
    fromAccount {
      id
      type
      name
      slug
      imageUrl
      ...AccountHoverCardFields
    }
  }
  ${accountHoverCardFields}
`;

export const conversationListFragment = gql`
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
      fromAccount {
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

export const isUserFollowingConversationQuery = gql`
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

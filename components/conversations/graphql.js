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

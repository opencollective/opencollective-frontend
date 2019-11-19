import gql from 'graphql-tag';

export const CommentFieldsFragment = gql`
  fragment CommentFields on CommentType {
    id
    createdAt
    updatedAt
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

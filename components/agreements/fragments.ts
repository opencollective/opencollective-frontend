import { gql } from '@apollo/client';

export const AGREEMENT_VIEW_FIELDS_FRAGMENT = gql`
  fragment AgreementViewFields on Agreement {
    id
    title
    createdAt
    expiresAt
    notes
    account {
      id
      type
      legacyId
      slug
      imageUrl
      name
    }
    createdBy {
      id
      type
      legacyId
      slug
      imageUrl
      name
    }
    attachment {
      id
      url
      name
      size
      type
    }
  }
`;

import { gql } from '@apollo/client';

export const AGREEMENT_VIEW_FIELDS_FRAGMENT = gql`
  fragment AgreementViewFields on Agreement {
    id
    title
    expiresAt
    notes
    account {
      id
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

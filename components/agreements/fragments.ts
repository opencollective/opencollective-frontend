import { gql } from '@apollo/client';

import { accountHoverCardFields } from '../AccountHoverCard';

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
      ...AccountHoverCardFields
    }
    createdBy {
      id
      type
      legacyId
      slug
      imageUrl
      name
      ...AccountHoverCardFields
    }
    attachment {
      id
      url
      name
      size
      type
    }
  }
  ${accountHoverCardFields}
`;

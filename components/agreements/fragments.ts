import { gql } from '../../lib/graphql/helpers';

import { accountHoverCardFieldsFragment } from '../AccountHoverCard';

export const agreementViewFieldsFragment = gql`
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
  ${accountHoverCardFieldsFragment}
`;

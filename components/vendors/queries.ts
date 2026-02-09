import { gql } from '../../lib/graphql/helpers';

import { accountHoverCardFieldsFragment } from '../AccountHoverCard';

export type { VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

export const vendorFieldsFragment = gql`
  fragment VendorFields on Vendor {
    id
    slug
    name
    legalName
    type
    description
    tags
    imageUrl
    isArchived
    createdAt

    location {
      id
      address
      country
      name
      structured
    }

    createdByAccount {
      id
      slug
      name
      imageUrl
      ...AccountHoverCardFields
    }

    vendorInfo {
      contact {
        name
        email
      }
      taxFormUrl
      taxFormRequired
      taxType
      taxId
      notes
    }

    payoutMethods {
      id
      type
      name
      data
    }

    orders(filter: OUTGOING, limit: 1) {
      totalCount
    }

    expenses(status: PAID, direction: SUBMITTED, limit: 1) {
      totalCount
    }

    visibleToAccounts {
      id
      type
      legacyId
      slug
      name
      imageUrl
    }
  }
  ${accountHoverCardFieldsFragment}
`;

export const setVendorArchiveMutation = gql`
  mutation SetVendorArchive($vendor: VendorEditInput!, $archive: Boolean!) {
    editVendor(archive: $archive, vendor: $vendor) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldsFragment}
`;

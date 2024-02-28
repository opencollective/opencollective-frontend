import { gql } from '../../lib/graphql/helpers';

import { accountHoverCardFields } from '../AccountHoverCard';

export type { VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

export const vendorFieldFragment = gql`
  fragment VendorFields on Vendor {
    id
    slug
    name
    legalName
    type
    description
    tags
    imageUrl(height: 96)
    hasImage
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
  }
  ${accountHoverCardFields}
`;

export const setVendorArchiveMutation = gql`
  mutation SetVendorArchive($vendor: VendorEditInput!, $archive: Boolean!) {
    editVendor(archive: $archive, vendor: $vendor) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldFragment}
`;

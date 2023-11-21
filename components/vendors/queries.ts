import { gql } from '@apollo/client';

export type { VendorFieldsFragment } from '../../lib/graphql/types/v2/graphql';

export const vendorFieldFragment = gql`
  fragment VendorFields on Vendor {
    id
    slug
    name
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

    orders {
      totalCount
    }

    expenses(status: PAID, direction: SUBMITTED) {
      totalCount
    }
  }
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

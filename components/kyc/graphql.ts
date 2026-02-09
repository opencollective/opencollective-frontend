import { gql } from '@apollo/client';

const kycVerificationManualProviderDataFieldsFragment = gql`
  fragment ManualKYCProviderDataFields on ManualKYCProviderData {
    notes
  }
`;

const kycVerificationProviderDataFieldsFragment = gql`
  fragment KYCProviderDataFields on KYCProviderData {
    ... on ManualKYCProviderData {
      ...ManualKYCProviderDataFields
    }
  }

  ${kycVerificationManualProviderDataFieldsFragment}
`;

const kycVerificationActionsFieldsFragment = gql`
  fragment KYCVerificationActionsFields on KYCVerification {
    id
    permissions {
      canRevokeKYCVerification
    }
  }
`;

export const kycVerificationFieldsFragment = gql`
  fragment KYCVerificationFields on KYCVerification {
    id
    status
    provider
    requestedAt
    verifiedAt
    revokedAt
    createdByUser {
      id
      name
      legalName
      slug
      type
      description
      imageUrl
      isHost
      isArchived
      isVerified
      ... on Individual {
        id
        isGuest
      }
      ... on AccountWithHost {
        host {
          id
          slug
          type
          isTrustedHost
          isFirstPartyHost
          isVerified
        }
        approvedAt
      }

      ... on Organization {
        host {
          id
          slug
          type
          isTrustedHost
          isFirstPartyHost
          isVerified
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
    }
    verifiedData {
      legalName
      legalAddress
    }
    providerData {
      ...KYCProviderDataFields
    }
    ...KYCVerificationActionsFields
  }

  ${kycVerificationProviderDataFieldsFragment}
  ${kycVerificationActionsFieldsFragment}
`;

export const kycVerificationCollectionFieldsFragment = gql`
  fragment KYCVerificationCollectionFields on KYCVerificationCollection {
    nodes {
      ...KYCVerificationFields
    }
    limit
    offset
    totalCount
  }

  ${kycVerificationFieldsFragment}
`;

export const kycStatusFieldsFragment = gql`
  fragment KYCStatusFields on KYCStatus {
    manual {
      ...KYCVerificationFields
    }
  }

  ${kycVerificationFieldsFragment}
`;

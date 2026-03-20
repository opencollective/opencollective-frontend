import { gql } from '@apollo/client';

const kycVerificationManualProviderDataFields = gql`
  fragment ManualKYCProviderDataFields on ManualKYCProviderData {
    notes
  }
`;

const kycVerificationProviderDataFields = gql`
  fragment KYCProviderDataFields on KYCProviderData {
    ... on ManualKYCProviderData {
      ...ManualKYCProviderDataFields
    }
  }

  ${kycVerificationManualProviderDataFields}
`;

const kycVerificationActionsFields = gql`
  fragment KYCVerificationActionsFields on KYCVerification {
    id
    permissions {
      canRevokeKYCVerification
    }
  }
`;

export const kycVerificationFields = gql`
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

  ${kycVerificationProviderDataFields}
  ${kycVerificationActionsFields}
`;

export const kycVerificationCollectionFields = gql`
  fragment KYCVerificationCollectionFields on KYCVerificationCollection {
    nodes {
      ...KYCVerificationFields
    }
    limit
    offset
    totalCount
  }

  ${kycVerificationFields}
`;

export const kycStatusFields = gql`
  fragment KYCStatusFields on KYCStatus {
    manual {
      ...KYCVerificationFields
    }
  }

  ${kycVerificationFields}
`;

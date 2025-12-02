import { gql } from '@apollo/client';

import { accountHoverCardFields } from '../AccountHoverCard';

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
      account {
        ...AccountHoverCardFields
      }
    }
    limit
    offset
    totalCount
  }

  ${kycVerificationFields}
  ${accountHoverCardFields}
`;

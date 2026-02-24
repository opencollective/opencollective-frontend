import { gql } from '../../../../lib/graphql/helpers';

const manualPaymentProviderFragment = gql`
  fragment ManualPaymentProviderFragment on ManualPaymentProvider {
    id
    type
    name
    instructions
    icon
    accountDetails
    isArchived
    createdAt
    updatedAt
  }
`;

export const editCollectiveBankTransferHostQuery = gql`
  query EditCollectiveBankTransferHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      name
      legacyId
      currency
      settings
      connectedAccounts {
        id
        service
      }
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
      payoutMethods {
        id
        name
        data
        type
      }
      manualPaymentProviders {
        ...ManualPaymentProviderFragment
      }
    }
  }
  ${manualPaymentProviderFragment}
`;

export const createManualPaymentProviderMutation = gql`
  mutation CreateManualPaymentProvider(
    $host: AccountReferenceInput!
    $manualPaymentProvider: ManualPaymentProviderCreateInput!
  ) {
    createManualPaymentProvider(host: $host, manualPaymentProvider: $manualPaymentProvider) {
      ...ManualPaymentProviderFragment
    }
  }
  ${manualPaymentProviderFragment}
`;

export const updateManualPaymentProviderMutation = gql`
  mutation UpdateManualPaymentProvider(
    $manualPaymentProvider: ManualPaymentProviderReferenceInput!
    $input: ManualPaymentProviderUpdateInput!
  ) {
    updateManualPaymentProvider(manualPaymentProvider: $manualPaymentProvider, input: $input) {
      ...ManualPaymentProviderFragment
    }
  }
  ${manualPaymentProviderFragment}
`;

export const deleteManualPaymentProviderMutation = gql`
  mutation DeleteManualPaymentProvider($manualPaymentProvider: ManualPaymentProviderReferenceInput!) {
    deleteManualPaymentProvider(manualPaymentProvider: $manualPaymentProvider) {
      ...ManualPaymentProviderFragment
    }
  }
  ${manualPaymentProviderFragment}
`;

export const reorderManualPaymentProvidersMutation = gql`
  mutation ReorderManualPaymentProviders(
    $host: AccountReferenceInput!
    $type: ManualPaymentProviderType!
    $providers: [ManualPaymentProviderReferenceInput!]!
  ) {
    reorderManualPaymentProviders(host: $host, type: $type, providers: $providers) {
      ...ManualPaymentProviderFragment
    }
  }
  ${manualPaymentProviderFragment}
`;

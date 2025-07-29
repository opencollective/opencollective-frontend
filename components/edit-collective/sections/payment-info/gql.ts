import { gql } from '../../../../lib/graphql/helpers';

export const PayoutMethodFragment = gql`
  fragment PayoutMethodFields on PayoutMethod {
    id
    type
    name
    isSaved
    data
    canBeEdited
    canBeDeleted
  }
`;

const PaymentMethodFragment = gql`
  fragment PaymentMethodFields on PaymentMethod {
    id
    legacyId
    name
    data
    service
    type
    balance {
      valueInCents
      currency
    }
    expiryDate
    monthlyLimit {
      valueInCents
    }
    account {
      id
      slug
      name
    }
    limitedToHosts {
      id
      slug
      name
    }
    recurringContributions: orders(
      onlyActiveSubscriptions: true
      status: [ACTIVE, ERROR, PENDING, REQUIRE_CLIENT_CONFIRMATION]
    ) {
      totalCount
      nodes {
        id
        legacyId
        toAccount {
          id
          name
        }
        needsConfirmation
      }
    }
  }
`;

export const managePaymentMethodsQuery = gql`
  query ManagePaymentMethods($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      legacyId
      type
      slug
      name
      legalName
      currency
      isHost
      settings
      paymentMethods(type: [CREDITCARD, US_BANK_ACCOUNT, SEPA_DEBIT, BACS_DEBIT, GIFTCARD, PREPAID]) {
        id
        ...PaymentMethodFields
      }
      payoutMethods(includeArchived: true) {
        id
        ...PayoutMethodFields
      }
    }
  }

  ${PaymentMethodFragment}
  ${PayoutMethodFragment}
`;

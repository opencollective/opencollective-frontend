import { gql } from '../../../lib/graphql/helpers';

import { accountHoverCardFieldsFragment } from '../../AccountHoverCard';
import { accountNavbarFieldsFragment } from '../../collective-navbar/fragments';

export const updatePaymentMethodFragment = gql`
  fragment UpdatePaymentMethod on PaymentMethod {
    id
    name
    data
    service
    type
    expiryDate
    account {
      id
    }
    balance {
      value
      valueInCents
      currency
    }
  }
`;

export const managedOrderFieldsFragment = gql`
  fragment ManagedOrderFields on Order {
    id
    legacyId
    nextChargeDate
    paymentMethod {
      ...UpdatePaymentMethod
    }
    manualPaymentProvider {
      id
      type
      name
    }
    amount {
      value
      valueInCents
      currency
    }
    totalAmount {
      value
      valueInCents
      currency
    }
    status
    description
    memo
    createdAt
    processedAt
    lastChargedAt
    hostFeePercent
    frequency
    tier {
      id
      name
    }
    tax {
      id
      type
      rate
      idNumber
    }
    permissions {
      id
      canResume
      canMarkAsExpired
      canMarkAsPaid
      canEdit
      canComment
      canSeePrivateActivities
      canSetTags
      canUpdateAccountingCategory
    }
    fromAccount {
      id
      name
      slug
      isIncognito
      type
      ... on Individual {
        isGuest
      }
      ...AccountHoverCardFields
    }
    createdByAccount {
      id
      name
      slug
      type
      ...AccountHoverCardFields
    }
    toAccount {
      id
      slug
      name
      type
      description
      tags
      imageUrl
      backgroundImageUrl(height: 256)
      settings
      ... on AccountWithParent {
        parent {
          id
          slug
          name
          type
          imageUrl
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
      ... on Organization {
        host {
          id
          slug
          paypalClientId
          supportedPaymentMethods
        }
      }
      ...AccountHoverCardFields
    }
    platformTipAmount {
      value
      valueInCents
    }
    paymentProcessorFee {
      valueInCents
      currency
    }
    pendingContributionData {
      expectedAt
      paymentMethod
      ponumber
      memo
      fromAccountInfo {
        name
        email
      }
    }
    accountingCategory {
      id
      name
      kind
      code
    }
  }
  ${accountHoverCardFieldsFragment}
  ${updatePaymentMethodFragment}
`;

export const manageContributionsQuery = gql`
  query RecurringContributions($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      features {
        id
        ...NavbarFields
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      orders(filter: OUTGOING, onlySubscriptions: true, includeIncognito: true) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
          totalDonations {
            value
            valueInCents
            currency
          }
        }
      }
    }
  }
  ${accountNavbarFieldsFragment}
  ${managedOrderFieldsFragment}
`;

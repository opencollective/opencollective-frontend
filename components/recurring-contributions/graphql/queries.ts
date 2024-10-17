import { gql } from '../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../AccountHoverCard';
import { accountNavbarFieldsFragment } from '../../collective-navbar/fragments';

export const paymentMethodFragment = gql`
  fragment UpdatePaymentMethodFragment on PaymentMethod {
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

export const managedOrderFragment = gql`
  fragment ManagedOrderFields on Order {
    id
    legacyId
    nextChargeDate
    paymentMethod {
      ...UpdatePaymentMethodFragment
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
    totalDonations {
      value
      valueInCents
      currency
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
  ${accountHoverCardFields}
  ${paymentMethodFragment}
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
        }
      }
    }
  }
  ${accountNavbarFieldsFragment}
  ${managedOrderFragment}
`;

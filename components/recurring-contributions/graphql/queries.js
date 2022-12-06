import { gql } from '@apollo/client';

import { collectiveNavbarFieldsFragment } from '../../collective-page/graphql/fragments';

export const managedOrderFragment = gql`
  fragment ManagedOrderFields on Order {
    id
    legacyId
    nextChargeDate
    paymentMethod {
      id
      service
      name
      type
      expiryDate
      data
      balance {
        value
        valueInCents
        currency
      }
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
    createdAt
    frequency
    tier {
      id
      name
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
    }
    toAccount {
      id
      slug
      name
      type
      description
      tags
      imageUrl
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
    }
    platformTipAmount {
      value
      valueInCents
    }
  }
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
      processingOrders: orders(filter: OUTGOING, includeIncognito: true, status: [PENDING, PROCESSING]) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
  ${managedOrderFragment}
`;

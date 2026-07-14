import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

export const accountPaymentIntentsCountsQuery = gql`
  query AccountPaymentIntentsCounts($account: AccountReferenceInput!, $host: AccountReferenceInput!) {
    all: paymentIntents(account: $account, host: $host, includeChildrenPaymentIntents: true, limit: 0) {
      totalCount
    }
    contributions: paymentIntents(
      account: $account
      host: $host
      includeChildrenPaymentIntents: true
      direction: INCOMING
      type: [Contribution, AddedMoney]
      limit: 0
    ) {
      totalCount
    }
    payouts: paymentIntents(
      account: $account
      host: $host
      includeChildrenPaymentIntents: true
      direction: OUTGOING
      type: [PaymentRequest, GrantRequest, CardCharge]
      limit: 0
    ) {
      totalCount
    }
  }
`;

export const accountPaymentIntentsQuery = gql`
  query AccountPaymentIntents(
    $account: AccountReferenceInput!
    $host: AccountReferenceInput!
    $includeChildrenPaymentIntents: Boolean!
    $status: [PaymentIntentStatus!]
    $type: [PaymentIntentType!]
    $direction: PaymentIntentDirection
    $dateFrom: DateTime
    $dateTo: DateTime
    $limit: Int!
    $offset: Int!
  ) {
    paymentIntents(
      account: $account
      host: $host
      includeChildrenPaymentIntents: $includeChildrenPaymentIntents
      status: $status
      type: $type
      direction: $direction
      dateFrom: $dateFrom
      dateTo: $dateTo
      limit: $limit
      offset: $offset
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        publicId
        type
        status
        description
        createdAt
        paidAt
        payer {
          id
          slug
          name
          type
          imageUrl
          ...AccountHoverCardFields
        }
        payee {
          id
          slug
          name
          type
          imageUrl
          ...AccountHoverCardFields
        }
        amountSent(currencySource: HOST) {
          valueInCents
          currency
        }
        amountReceived(currencySource: HOST) {
          valueInCents
          currency
        }
        amountPledged(currencySource: HOST) {
          valueInCents
          currency
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export const paymentIntentDetailsQuery = gql`
  query PaymentIntentDetails($publicId: String!) {
    paymentIntent(publicId: $publicId) {
      id
      publicId
      type
      status
      description
      createdAt
      paidAt
      payer {
        id
        publicId
        slug
        name
        type
        imageUrl
        ...AccountHoverCardFields
      }
      payee {
        id
        publicId
        slug
        name
        type
        imageUrl
        ...AccountHoverCardFields
      }
      host {
        id
        publicId
        slug
        name
      }
      amountPledged(currencySource: HOST) {
        valueInCents
        currency
      }
      amountSent(currencySource: HOST) {
        valueInCents
        currency
      }
      amountReceived(currencySource: HOST) {
        valueInCents
        currency
      }
      transactions {
        id
        publicId
        legacyId
        kind
        type
        description
        createdAt
        group
        amount {
          valueInCents
          currency
        }
        account {
          id
          slug
          name
          imageUrl
        }
        oppositeAccount {
          id
          publicId
          slug
          name
          imageUrl
        }
      }
      expense {
        id
        publicId
        legacyId
        type
        status
        description
        amountV2 {
          valueInCents
          currency
        }
        account {
          id
          publicId
          slug
          name
        }
        payee {
          id
          publicId
          slug
          name
        }
      }
      order {
        id
        publicId
        legacyId
        status
        description
        totalAmount {
          valueInCents
          currency
        }
        fromAccount {
          id
          publicId
          slug
          name
        }
        toAccount {
          id
          publicId
          slug
          name
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

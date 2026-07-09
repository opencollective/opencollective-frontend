import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

export const hostPaymentIntentsQuery = gql`
  query HostPaymentIntents(
    $host: AccountReferenceInput!
    $hostContext: HostContext
    $account: AccountReferenceInput
    $includeChildrenPaymentIntents: Boolean!
    $status: [PaymentIntentStatus!]
    $dateFrom: DateTime
    $dateTo: DateTime
    $limit: Int!
    $offset: Int!
  ) {
    paymentIntents(
      host: $host
      hostContext: $hostContext
      account: $account
      includeChildrenPaymentIntents: $includeChildrenPaymentIntents
      status: $status
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
      host {
        id
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
          slug
          name
          imageUrl
        }
      }
      expense {
        id
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
          slug
          name
        }
        payee {
          id
          slug
          name
        }
      }
      order {
        id
        legacyId
        status
        description
        totalAmount {
          valueInCents
          currency
        }
        fromAccount {
          id
          slug
          name
        }
        toAccount {
          id
          slug
          name
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

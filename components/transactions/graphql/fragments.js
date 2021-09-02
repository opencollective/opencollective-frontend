import { gqlV2 } from '../../../lib/graphql/helpers';

export const transactionsQueryCollectionFragment = gqlV2/* GraphQL */ `
  fragment TransactionsQueryCollectionFragment on TransactionCollection {
    totalCount
    offset
    limit
    nodes {
      id
      uuid
      kind
      amount {
        currency
        valueInCents
      }
      netAmount {
        currency
        valueInCents
      }
      taxAmount {
        valueInCents
        currency
      }
      taxInfo {
        id
      }
      platformFee {
        currency
        valueInCents
      }
      paymentProcessorFee {
        currency
        valueInCents
      }
      hostFee {
        currency
        valueInCents
      }
      type
      description
      createdAt
      isRefunded
      isRefund
      isOrderRejected
      toAccount {
        id
        name
        slug
        type
        imageUrl
        isIncognito
        settings
        ... on Individual {
          isGuest
        }
        ... on Collective {
          host {
            id
            name
            slug
            type
          }
        }
        ... on AccountWithHost {
          hostFeePercent
          platformFeePercent
        }
      }
      fromAccount {
        id
        name
        slug
        type
        imageUrl
        isIncognito
        ... on Event {
          parent {
            id
          }
        }
        ... on Project {
          parent {
            id
          }
        }
        ... on Individual {
          isGuest
        }
        ... on AccountWithHost {
          hostFeePercent
          platformFeePercent
        }
      }
      host {
        id
        name
        slug
        type
        imageUrl
      }
      giftCardEmitterAccount {
        id
        name
        slug
        type
        imageUrl
      }
      permissions {
        id
        canRefund
        canDownloadInvoice
        canReject
      }
      paymentMethod {
        type
      }
      order {
        id
        status
      }
      expense {
        id
        status
        tags
        type
        legacyId
        # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
        comments(limit: 1) {
          totalCount
        }
        payoutMethod {
          id
          type
        }
        account {
          id
          slug
        }
        createdByAccount {
          id
          slug
        }
      }
      relatedTransactions(kind: [HOST_FEE]) {
        id
        type
        kind
        netAmount {
          currency
          valueInCents
        }
      }
    }
  }
`;

import { gql } from '@apollo/client';

export const transactionsQueryCollectionFragment = gql`
  fragment TransactionsQueryCollectionFragment on TransactionCollection {
    totalCount
    offset
    limit
    kinds
    paymentMethodTypes
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
        rate
        type
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
        ... on AccountWithParent {
          parent {
            id
            slug
          }
        }
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
      account {
        id
        isIncognito
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
        id
        type
      }
      payoutMethod {
        id
        type
      }
      order {
        id
        legacyId
        status
        memo
        processedAt
        toAccount {
          id
          slug
        }
      }
      expense {
        id
        status
        tags
        type
        feesPayer
        amount
        currency
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
      relatedTransactions(kind: [HOST_FEE, PAYMENT_PROCESSOR_COVER]) {
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

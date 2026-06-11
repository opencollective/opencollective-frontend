import { gql } from '@/lib/graphql/helpers';

import { hostedCollectiveFields } from '@/components/dashboard/sections/collectives/queries';

export const hostedAccountProfileQuery = gql`
  query HostedAccountProfile($hostSlug: String!, $accountId: String!) {
    host(slug: $hostSlug) {
      id
      slug
      name
      currency
      type
      hostFeePercent
    }
    account(id: $accountId) {
      id
      description
      longDescription
      socialLinks {
        type
        url
      }
      location {
        id
        address
        country
      }
      stats {
        id
        balanceTimeSeries(timeUnit: MONTH, includeChildren: true) {
          timeUnit
          nodes {
            date
            amount {
              valueInCents
              currency
            }
          }
        }
        totalAmountReceivedTimeSeries(timeUnit: MONTH, includeChildren: true) {
          timeUnit
          nodes {
            date
            amount {
              valueInCents
              currency
            }
          }
        }
      }
      firstTransaction: transactions(
        limit: 1
        offset: 0
        orderBy: { field: CREATED_AT, direction: ASC }
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...HostedAccountTransaction
        }
      }
      recentContributions: transactions(
        limit: 5
        offset: 0
        type: CREDIT
        kind: [CONTRIBUTION, ADDED_FUNDS]
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...HostedAccountTransaction
        }
      }
      recentPayouts: transactions(
        limit: 5
        offset: 0
        type: DEBIT
        kind: [EXPENSE]
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...HostedAccountTransaction
        }
      }
      # Extra fields on children (merged with HostedCollectiveFields' childrenAccounts):
      # the host enables the same row actions (MoreActionsMenu) as the main account.
      childrenAccounts {
        nodes {
          id
          ... on AccountWithHost {
            host {
              id
              legacyId
              name
              slug
              imageUrl
            }
          }
        }
      }
      ...HostedCollectiveFields
    }
  }

  fragment HostedAccountTransaction on Transaction {
    id
    clearedAt
    createdAt
    type
    kind
    description
    amount {
      valueInCents
      currency
    }
    netAmount {
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
    expense {
      id
      legacyId
    }
    order {
      id
      legacyId
    }
  }

  ${hostedCollectiveFields}
`;

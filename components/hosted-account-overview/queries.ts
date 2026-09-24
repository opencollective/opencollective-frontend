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
      hostedAccountAgreements(accounts: [{ id: $accountId }], includeChildren: true, limit: 0) {
        totalCount
      }
    }
    account(id: $accountId) {
      id
      description
      longDescription
      updates(includeChildren: true, onlyPublishedUpdates: true, limit: 0) {
        totalCount
      }
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

export const hostedAccountFinancialActivityQuery = gql`
  query HostedAccountFinancialActivity(
    $hostSlug: String!
    $dateRange: MetricsDateRangeInput!
    $timeUnit: TimeUnit!
    $accountFilter: HostedCollectivesFinancialActivityMetricsFiltersAllOf
    $groupByAccount: Boolean!
  ) {
    host(slug: $hostSlug) {
      id
      currency
      metrics {
        # Consolidated parent+children timeseries, scoped to this account's subtree.
        consolidated: hostedCollectivesFinancialActivity(
          input: {
            dateRange: $dateRange
            bucket: $timeUnit
            measures: [amountReceived, amountSpent, transactionCount, contributionsCount, payoutsCount]
            filters: $accountFilter
          }
        ) {
          rows {
            bucket
            values {
              amountReceived {
                valueInCents
                currency
              }
              amountSpent {
                valueInCents
                currency
              }
              transactionCount
              contributionsCount
              payoutsCount
            }
          }
        }
        # Top-N children timeseries (events/projects) — only fetched in the by-account view.
        byAccount: hostedCollectivesFinancialActivity(
          input: {
            dateRange: $dateRange
            bucket: $timeUnit
            measures: [amountReceived, amountSpent, transactionCount, contributionsCount, payoutsCount]
            filters: $accountFilter
            groupBy: [account]
            orderBy: [{ measure: amountReceived, direction: desc }]
            limit: 6
          }
        ) @include(if: $groupByAccount) {
          rows {
            bucket
            group {
              account {
                id
                slug
                name
                imageUrl
                type
              }
            }
            values {
              amountReceived {
                valueInCents
                currency
              }
              amountSpent {
                valueInCents
                currency
              }
              transactionCount
            }
          }
        }
      }
    }
  }
`;

export const hostedAccountContributionTypesQuery = gql`
  query HostedAccountContributionTypes(
    $hostSlug: String!
    $dateRange: MetricsDateRangeInput!
    $accountFilter: HostedCollectivesFinancialActivityMetricsFiltersAllOf
  ) {
    host(slug: $hostSlug) {
      id
      currency
      metrics {
        contributionTypes: hostedCollectivesFinancialActivity(
          input: {
            dateRange: $dateRange
            measures: [amountReceived, contributionsCount]
            filters: $accountFilter
            groupBy: [contributionFrequency]
            orderBy: [{ measure: amountReceived, direction: desc }]
            limit: 10
          }
        ) {
          rows {
            group {
              contributionFrequency
            }
            values {
              amountReceived {
                valueInCents
                currency
              }
              contributionsCount
            }
          }
        }
      }
    }
  }
`;

export const hostedAccountTransactionSizesQuery = gql`
  query HostedAccountTransactionSizes(
    $hostSlug: String!
    $dateRange: MetricsDateRangeInput!
    $accountFilter: HostedCollectivesTransactionSizesMetricsFiltersAllOf
  ) {
    host(slug: $hostSlug) {
      id
      currency
      metrics {
        transactionSizes: hostedCollectivesTransactionSizes(
          input: {
            dateRange: $dateRange
            measures: [transactionCount, amount]
            filters: $accountFilter
            groupBy: [amountBand, kindClass]
            limit: 100
          }
        ) {
          rows {
            group {
              amountBand
              kindClass
            }
            values {
              transactionCount
              amount {
                valueInCents
                currency
              }
            }
          }
        }
      }
    }
  }
`;

export const hostedAccountUpdatesQuery = gql`
  query HostedAccountUpdates($accountId: String!, $limit: Int!, $offset: Int!) {
    account(id: $accountId) {
      id
      updates(includeChildren: true, onlyPublishedUpdates: true, limit: $limit, offset: $offset) {
        totalCount
        limit
        offset
        nodes {
          id
          slug
          title
          publishedAt
          account {
            id
            slug
            name
            imageUrl
            type
          }
        }
      }
    }
  }
`;

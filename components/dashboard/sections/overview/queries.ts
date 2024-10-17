import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

export const timelineQuery = gql`
  query Timeline($slug: String!, $limit: Int, $dateTo: DateTime, $classes: [ActivityClassType!]) {
    account(slug: $slug) {
      id
      feed(limit: $limit, dateTo: $dateTo, classes: $classes) {
        id
        createdAt
        type
        data
        isSystem
        fromAccount {
          id
          name
          slug
          type
          isIncognito
          ...AccountHoverCardFields

          imageUrl
          ... on Individual {
            isGuest
          }
        }
        host {
          id
          name
          slug
          type
        }
        account {
          id
          name
          slug
          type
          isIncognito
          ...AccountHoverCardFields
          imageUrl
          ... on Individual {
            isGuest
          }
          ... on AccountWithParent {
            parent {
              id
              slug
              name
              type
            }
          }
        }
        expense {
          id
          legacyId
          description
          amountV2 {
            valueInCents
            currency
          }
          payee {
            id
            name
            slug
            imageUrl
            ...AccountHoverCardFields
          }
          account {
            id
            name
            type
            slug
            ...AccountHoverCardFields
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        order {
          id
          legacyId
          description
          toAccount {
            id
            name
            slug
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        update {
          id
          legacyId
          title
          summary
          slug
        }
        conversation {
          id
          title
          summary
          slug
        }
        individual {
          id
          slug
          name
          type
          imageUrl
          isIncognito
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export const collectiveBalanceQuery = gql`
  query CollectiveBalance($slug: String!) {
    account(slug: $slug) {
      id
      name
      imageUrl
      slug
      ...AccountHoverCardFields
      type

      stats {
        id
        balance {
          currency
          valueInCents
        }
      }

      childrenAccounts {
        totalCount
        nodes {
          id
          name
          slug
          imageUrl
          isArchived
          ...AccountHoverCardFields
          ... on Event {
            startsAt
            endsAt
          }
          stats {
            id
            balance {
              currency
              valueInCents
            }
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export const metricsPerAccountQuery = gql`
  query MetricsPerAccount(
    $slug: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $compareFrom: DateTime
    $compareTo: DateTime
    $includeComparison: Boolean!
    $includeBalance: Boolean!
    $includeSpent: Boolean!
    $includeReceived: Boolean!
    $includeContributionsCount: Boolean!
  ) {
    account(slug: $slug) {
      id
      ...AccountMetrics

      childrenAccounts {
        totalCount
        nodes {
          id
          ...AccountMetrics
        }
      }
    }
  }
  fragment AccountMetrics on Account {
    ...AccountHoverCardFields
    balance: stats @include(if: $includeBalance) {
      id
      current: balance(dateTo: $dateTo) {
        currency
        valueInCents
      }
      comparison: balance(dateTo: $compareTo) @include(if: $includeComparison) {
        currency
        valueInCents
      }
    }
    spent: stats @include(if: $includeSpent) {
      id
      current: totalAmountSpent(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      comparison: totalAmountSpent(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
        @include(if: $includeComparison) {
        currency
        valueInCents
      }
    }
    received: stats @include(if: $includeReceived) {
      id
      current: totalAmountReceived(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      comparison: totalAmountReceived(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
        @include(if: $includeComparison) {
        currency
        valueInCents
      }
    }

    contributions: stats @include(if: $includeContributionsCount) {
      id
      current: contributionsCount(dateFrom: $dateFrom, dateTo: $dateTo)
      comparison: contributionsCount(dateFrom: $compareFrom, dateTo: $compareTo) @include(if: $includeComparison)
    }
  }
  ${accountHoverCardFields}
`;

export const overviewMetricsQuery = gql`
  query OverviewMetrics(
    $slug: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $compareFrom: DateTime
    $compareTo: DateTime
    $includeComparison: Boolean!
    $includeChildren: Boolean
    $includeBalance: Boolean!
    $includeBalanceTimeseries: Boolean!
    $includeSpent: Boolean!
    $includeReceived: Boolean!
    $includeReceivedTimeseries: Boolean!
    $includeContributionsCount: Boolean!
    $timeUnit: TimeUnit
  ) {
    account(slug: $slug) {
      id
      isActive
      ...AccountHoverCardFields
      balance: stats @include(if: $includeBalance) {
        id
        current: balance(includeChildren: $includeChildren, dateTo: $dateTo) {
          currency
          valueInCents
        }
        comparison: balance(includeChildren: $includeChildren, dateTo: $compareTo) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }
      balanceTimeseries: stats @include(if: $includeBalanceTimeseries) {
        id
        current: balanceTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          timeUnit: $timeUnit
        ) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
        comparison: balanceTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          timeUnit: $timeUnit
        ) @include(if: $includeComparison) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
      }
      spent: stats @include(if: $includeSpent) {
        id
        current: totalAmountSpent(includeChildren: $includeChildren, dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
          currency
          valueInCents
        }
        comparison: totalAmountSpent(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }
      received: stats @include(if: $includeReceived) {
        id
        current: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          net: true
        ) @include(if: $includeReceived) {
          currency
          valueInCents
        }
        comparison: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }
      receivedTimeseries: stats @include(if: $includeReceivedTimeseries) {
        id
        current: totalAmountReceivedTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          timeUnit: $timeUnit
          net: true
        ) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
        comparison: totalAmountReceivedTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          timeUnit: $timeUnit
          net: true
        ) @include(if: $includeComparison) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
      }

      contributionsCount: stats @include(if: $includeContributionsCount) {
        id
        current: contributionsCount(includeChildren: $includeChildren, dateFrom: $dateFrom, dateTo: $dateTo)
        comparison: contributionsCount(includeChildren: $includeChildren, dateFrom: $compareFrom, dateTo: $compareTo)
          @include(if: $includeComparison)
      }
    }
  }
  ${accountHoverCardFields}
`;

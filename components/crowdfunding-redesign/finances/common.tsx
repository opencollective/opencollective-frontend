import { gql } from '@apollo/client';

import { accountHoverCardFields } from '../../AccountHoverCard';

// TODO: Similar to `profileAccountsQuery`, migrate to single query if behavior is adopted and should be identical
export const financesQuery = gql`
  query Finances(
    $slug: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $compareFrom: DateTime
    $compareTo: DateTime
    $includeComparison: Boolean!
    $includeBalance: Boolean!
    $includeSpent: Boolean!
    $includeReceived: Boolean!
    $includeBalanceTimeseries: Boolean!
    $includeReceivedTimeseries: Boolean!
    $timeUnit: TimeUnit
    $includeChildren: Boolean!
  ) {
    account(slug: $slug) {
      id
      name
      type

      totalBalance: stats {
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

      totalSpent: stats {
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
      totalReceived: stats {
        id
        current: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          net: true
        ) {
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

      ...ProfileMetrics

      childrenAccounts {
        totalCount
        nodes {
          id
          ...ProfileMetrics
        }
      }
    }
  }

  fragment ProfileMetrics on Account {
    ...AccountHoverCardFields
    balance: stats @include(if: $includeBalance) {
      id
      current: balance(dateTo: $dateTo) {
        currency
        valueInCents
      }
      # comparison: balance(dateTo: $compareTo) @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
    spent: stats @include(if: $includeSpent) {
      id
      current: totalAmountSpent(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      # comparison: totalAmountSpent(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
      #   @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
    received: stats @include(if: $includeReceived) {
      id
      current: totalAmountReceived(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      # comparison: totalAmountReceived(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
      #   @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
  }
  ${accountHoverCardFields}
`;

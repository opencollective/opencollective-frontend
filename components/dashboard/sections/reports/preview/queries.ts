import { gql } from '@apollo/client';

export const hostReportQuery = gql`
  query HostReports(
    $hostSlug: String!
    $dateTo: DateTime
    $dateFrom: DateTime
    $timeUnit: TimeUnit
    $includeGroups: Boolean!
  ) {
    host(slug: $hostSlug) {
      id
      currency
      hostTransactionsReports(dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: $timeUnit) {
        timeUnit
        nodes {
          date
          managedFunds {
            startingBalance {
              valueInCents
              currency
            }
            endingBalance {
              valueInCents
              currency
            }
            totalChange {
              valueInCents
              currency
            }
            groups @include(if: $includeGroups) {
              amount {
                valueInCents
                currency
              }
              netAmount {
                valueInCents
                currency
              }
              platformFee {
                valueInCents
                currency
              }
              paymentProcessorFee {
                valueInCents
                currency
              }
              hostFee {
                valueInCents
                currency
              }
              taxAmount {
                valueInCents
                currency
              }
              kind
              isHost
              type
              expenseType
              isRefund
            }
          }
          operationalFunds {
            startingBalance {
              valueInCents
              currency
            }
            endingBalance {
              valueInCents
              currency
            }
            totalChange {
              valueInCents
              currency
            }
            groups @include(if: $includeGroups) {
              amount {
                valueInCents
                currency
              }
              netAmount {
                valueInCents
                currency
              }
              platformFee {
                valueInCents
                currency
              }
              paymentProcessorFee {
                valueInCents
                currency
              }
              hostFee {
                valueInCents
                currency
              }
              taxAmount {
                valueInCents
                currency
              }
              kind
              isHost
              type
              expenseType
              isRefund
            }
          }
        }
      }
    }
  }
`;

export const reportQuery = gql`
  query AccountReports(
    $accountSlug: String!
    $dateTo: DateTime
    $dateFrom: DateTime
    $timeUnit: TimeUnit
    $includeGroups: Boolean!
  ) {
    account(slug: $accountSlug) {
      id
      currency
      transactionReports(dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: $timeUnit) {
        timeUnit
        nodes {
          date
          startingBalance {
            valueInCents
            currency
          }
          endingBalance {
            valueInCents
            currency
          }
          totalChange {
            valueInCents
            currency
          }
          groups @include(if: $includeGroups) {
            amount {
              valueInCents
              currency
            }
            netAmount {
              valueInCents
              currency
            }
            platformFee {
              valueInCents
              currency
            }
            paymentProcessorFee {
              valueInCents
              currency
            }
            hostFee {
              valueInCents
              currency
            }
            taxAmount {
              valueInCents
              currency
            }
            kind
            isHost
            type
            expenseType
            isRefund
          }
        }
      }
    }
  }
`;

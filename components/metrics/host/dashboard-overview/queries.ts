import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

export const hostMetricsOverviewSectionQuery = gql`
  query HostMetricsOverviewSection(
    $hostSlug: String!
    $currentRange: MetricsDateRangeInput!
    $previousRange: MetricsDateRangeInput!
    $financialFilters: HostedCollectivesFinancialActivityMetricsFiltersAllOf
    $membershipFilters: HostedCollectivesMembershipMetricsFiltersAllOf
    $hostingFilters: HostedCollectivesHostingMetricsFiltersAllOf
  ) {
    host(slug: $hostSlug) {
      id
      slug
      currency
      metrics {
        # Active = collectives with any transaction in the period (parent rollup).
        currentActive: hostedCollectivesFinancialActivity(
          input: { dateRange: $currentRange, measures: [activeCollectives], filters: $financialFilters }
        ) {
          rows {
            values {
              activeCollectives
            }
          }
        }
        previousActive: hostedCollectivesFinancialActivity(
          input: { dateRange: $previousRange, measures: [activeCollectives], filters: $financialFilters }
        ) {
          rows {
            values {
              activeCollectives
            }
          }
        }

        # Joined + churned in period — distinct counts so re-hosting doesn't double-count.
        currentMembership: hostedCollectivesMembership(
          input: {
            dateRange: $currentRange
            measures: [joinedDistinctCollectives, churnedDistinctCollectives]
            filters: $membershipFilters
          }
        ) {
          rows {
            values {
              joinedDistinctCollectives
              churnedDistinctCollectives
            }
          }
        }
        previousMembership: hostedCollectivesMembership(
          input: {
            dateRange: $previousRange
            measures: [joinedDistinctCollectives, churnedDistinctCollectives]
            filters: $membershipFilters
          }
        ) {
          rows {
            values {
              joinedDistinctCollectives
              churnedDistinctCollectives
            }
          }
        }

        # Total hosted at the end of the period (range source — interval overlap).
        # Used as the "out of N" denominator on the Active card and to derive Inactive.
        currentHosted: hostedCollectivesHosting(
          input: { dateRange: $currentRange, measures: [hostedCollectives], filters: $hostingFilters }
        ) {
          rows {
            values {
              hostedCollectives
            }
          }
        }
        previousHosted: hostedCollectivesHosting(
          input: { dateRange: $previousRange, measures: [hostedCollectives], filters: $hostingFilters }
        ) {
          rows {
            values {
              hostedCollectives
            }
          }
        }

        topByIncome: hostedCollectivesFinancialActivity(
          input: {
            dateRange: $currentRange
            measures: [incomeAmount]
            filters: $financialFilters
            groupBy: [account]
            orderBy: [{ measure: incomeAmount, direction: desc }]
            having: [{ measure: incomeAmount, op: gt, value: 0 }]
            limit: 5
          }
        ) {
          rows {
            group {
              account {
                id
                publicId
                slug
                name
                type
                imageUrl
                ...AccountHoverCardFields
              }
            }
            values {
              incomeAmount {
                valueInCents
                currency
              }
            }
          }
        }

        topBySpending: hostedCollectivesFinancialActivity(
          input: {
            dateRange: $currentRange
            measures: [spendingAmount]
            filters: $financialFilters
            groupBy: [account]
            orderBy: [{ measure: spendingAmount, direction: desc }]
            having: [{ measure: spendingAmount, op: gt, value: 0 }]
            limit: 5
          }
        ) {
          rows {
            group {
              account {
                id
                publicId
                slug
                name
                type
                imageUrl
                ...AccountHoverCardFields
              }
            }
            values {
              spendingAmount {
                valueInCents
                currency
              }
            }
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

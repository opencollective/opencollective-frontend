import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

export const workspaceHomeQuery = gql`
  query WorkspaceHome($slug: String!, $limit: Int, $dateTo: DateTime, $classes: [ActivityClassType!]) {
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
          imageUrl(height: 48)
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
          imageUrl(height: 48)
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
          account {
            id
            name
            type
            slug
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
        individual {
          id
          slug
          name
          type
          imageUrl(height: 48)
          isIncognito
        }
      }
    }
  }
`;

export const collectiveOverviewQuery = gql`
  query CollectiveOverview(
    $slug: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $compareFrom: DateTime
    $compareTo: DateTime
    $includeComparison: Boolean!
    $includeChildren: Boolean!
  ) {
    account(slug: $slug) {
      name
      imageUrl
      slug
      ...AccountHoverCardFields
      stats {
        totalBalance: balance(includeChildren: $includeChildren) {
          currency
          valueInCents
        }
        balance(includeChildren: false) @include(if: $includeChildren) {
          currency
          valueInCents
        }
        spent: totalAmountSpent(includeChildren: $includeChildren, dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
          currency
          valueInCents
        }
        spentComparison: totalAmountSpent(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
        received: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          net: true
        ) {
          currency
          valueInCents
        }
        receivedComparison: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
        contributionsCount: contributionsCount(includeChildren: $includeChildren, dateFrom: $dateFrom, dateTo: $dateTo)
        contributionsCountComparison: contributionsCount(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
        ) @include(if: $includeComparison)
      }

      # newOrders: orders(dateFrom: $dateFrom, dateTo: $dateTo) {
      #   totalCount
      #   nodes {
      #     id
      #     createdAt
      #     amount {
      #       currency
      #       valueInCents
      #     }
      #     fromAccount {
      #       id
      #       slug
      #       name
      #       imageUrl
      #     }
      #     status
      #     frequency
      #   }
      # }
      pendingExpenses: expenses(
        limit: 0
        status: PENDING
        direction: RECEIVED
        includeChildrenExpenses: $includeChildren
      ) {
        totalCount
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

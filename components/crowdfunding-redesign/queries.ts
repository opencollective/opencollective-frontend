import { gql } from '@apollo/client';

export const updatesQuery = gql`
  query Updates($slug: String!) {
    account(slug: $slug) {
      updates(onlyPublishedUpdates: true) {
        totalCount
        nodes {
          id
          title
          html
          slug
          summary
          reactions
          userReactions
          userCanSeeUpdate
          publishedAt
          fromAccount {
            id
            name
            slug
            imageUrl
            type
          }
          comments {
            totalCount
          }
        }
      }
    }
  }
`;
export const profilePageQuery = gql`
  query ProfilePage($slug: String!) {
    account(slug: $slug) {
      id
      name
      slug
      imageUrl
      description
      longDescription
      backgroundImageUrl
      settings
      type
      currency
      isActive
      socialLinks {
        type
        url
      }

      updates(onlyPublishedUpdates: true) {
        totalCount
        nodes {
          id
          title
          html
          slug
          summary
          reactions
          userReactions
          userCanSeeUpdate
          publishedAt
          fromAccount {
            id
            name
            slug
            imageUrl
            type
          }
          comments {
            totalCount
          }
        }
      }
      expenses(limit: 20, direction: RECEIVED, status: PAID) {
        totalCount
        nodes {
          id
          description
          type
          status
          createdAt
          payee {
            id
            name
            type
            imageUrl
            slug
          }
          account {
            id
            name
            type
            imageUrl
            slug
          }
          amountV2 {
            valueInCents
            currency
          }
        }
      }

      contributionTransactions: transactions(
        limit: 20
        kind: [CONTRIBUTION, ADDED_FUNDS]
        isRefund: false
        type: CREDIT
      ) {
        totalCount
        nodes {
          id
          description
          createdAt
          type
          kind
          fromAccount {
            id
            name
            type
            slug
            imageUrl
          }
          toAccount {
            id
            name
            type
            slug
            imageUrl
          }
          amount {
            valueInCents
            currency
          }
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          name
          settings
          imageUrl
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
          name
          imageUrl
        }
      }

      ... on AccountWithContributions {
        tiers {
          totalCount
          nodes {
            id
            name
            slug
            type
            description
            button
            amount {
              valueInCents
              currency
            }
            currency
            minimumAmount {
              valueInCents
              currency
            }
            endsAt
            amountType
            frequency
            availableQuantity
          }
        }

        financialContributors: contributors(roles: [BACKER], limit: 150) {
          totalCount
          nodes {
            id
            name
            roles
            isAdmin
            isCore
            isBacker
            since
            image
            description
            collectiveSlug
            totalAmountDonated
            type
            publicMessage
            isIncognito
          }
        }
      }
      childrenAccounts {
        nodes {
          id
          name
          description
          type
          slug
          settings
          currency
          stats {
            totalAmountReceived {
              valueInCents
              currency
            }
            yearlyBudget {
              valueInCents
              currency
            }
            contributorsCount
          }
        }
      }

      stats {
        totalAmountReceived {
          valueInCents
          currency
        }
        yearlyBudget {
          valueInCents
          currency
        }
        contributorsCount
      }
    }
  }
`;

export const profileWrapperQuery = gql`
  query ProfileLayout($collectiveSlug: String!, $accountSlug: String, $includeAccount: Boolean!) {
    account: account(slug: $accountSlug) @include(if: $includeAccount) {
      id
      name
      slug
      settings
      type
      description
      longDescription
      backgroundImageUrl
      currency
      stats {
        yearlyBudget {
          valueInCents
          currency
        }
        totalAmountReceived(net: true) {
          valueInCents
          currency
        }
        totalAmountReceivedThisMonth: totalAmountReceived(
          net: true
          dateFrom: "2024-02-01T00:00:00.000Z"
          dateTo: "2024-03-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
        totalAmountReceivedThisYear: totalAmountReceived(
          net: true
          dateFrom: "2024-01-01T00:00:00.000Z"
          dateTo: "2025-01-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      # TODO: mutualize the account stuff as a fragment
      ... on AccountWithContributions {
        financialContributors: contributors(roles: [BACKER], limit: 5) {
          totalCount
          nodes {
            id
            name
            roles
            isAdmin
            isCore
            isBacker
            since
            image
            description
            collectiveSlug
            totalAmountDonated
            type
            publicMessage
            isIncognito
          }
        }
      }
    }
    collective: account(slug: $collectiveSlug) {
      id
      name
      slug
      imageUrl
      description
      longDescription
      backgroundImageUrl
      settings
      type
      currency
      isActive
      socialLinks {
        type
        url
      }
      stats {
        yearlyBudget {
          valueInCents
          currency
        }
        totalAmountReceived(net: true) {
          valueInCents
          currency
        }
        totalAmountReceivedThisMonth: totalAmountReceived(
          net: true
          dateFrom: "2024-02-01T00:00:00.000Z"
          dateTo: "2024-03-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
        totalAmountReceivedThisYear: totalAmountReceived(
          net: true
          dateFrom: "2024-01-01T00:00:00.000Z"
          dateTo: "2025-01-01T00:00:00.000Z"
        ) {
          valueInCents
          currency
        }
      }
      ... on AccountWithContributions {
        tiers {
          totalCount
          nodes {
            id
            name
            slug
            type
            description
            button
            amount {
              valueInCents
              currency
            }
            currency
            minimumAmount {
              valueInCents
              currency
            }
            endsAt
            amountType
            frequency
            availableQuantity
          }
        }
        financialContributors: contributors(roles: [BACKER], limit: 5) {
          totalCount
          nodes {
            id
            name
            roles
            isAdmin
            isCore
            isBacker
            since
            image
            description
            collectiveSlug
            totalAmountDonated
            type
            publicMessage
            isIncognito
          }
        }
      }

      updates(onlyPublishedUpdates: true) {
        totalCount
      }
      expenses(limit: 0, direction: RECEIVED, status: PAID, includeChildrenExpenses: true) {
        totalCount
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          name
          settings
          imageUrl
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
          name
          imageUrl
        }
      }
      childrenAccounts {
        nodes {
          id
          name
          description
          type
          slug
          settings
          currency
          stats {
            totalAmountReceived {
              valueInCents
              currency
            }
            yearlyBudget {
              valueInCents
              currency
            }
            contributorsCount
          }
        }
      }
    }
  }
`;

export const contributePageQuery = gql`
  query ContributePage($slug: String!) {
    account(slug: $slug) {
      id
      name
      slug
      imageUrl
      longDescription
      backgroundImageUrl
      settings
      type
      currency
      isActive

      stats {
        totalAmountReceived {
          valueInCents
          currency
        }
        yearlyBudget {
          valueInCents
          currency
        }
        contributorsCount
      }
      ... on AccountWithContributions {
        tiers {
          totalCount
          nodes {
            id
            name
            slug
            type
            description
            button
            amount {
              valueInCents
              currency
            }
            currency
            minimumAmount {
              valueInCents
              currency
            }
            endsAt
            amountType
            frequency
            availableQuantity
          }
        }

        financialContributors: contributors(roles: [BACKER], limit: 5) {
          totalCount
          nodes {
            id
            name
            roles
            isAdmin
            isCore
            isBacker
            since
            image
            description
            collectiveSlug
            totalAmountDonated
            type
            publicMessage
            isIncognito
          }
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          name
          settings
          imageUrl
        }
      }
    }
    projects: accounts(
      parent: { slug: $slug }
      type: [PROJECT]
      isActive: true
      orderBy: { field: BALANCE, direction: DESC }
    ) {
      totalCount
      nodes {
        id
        name
        description
        type
        slug
        settings
        currency
        stats {
          totalAmountReceived {
            valueInCents
            currency
          }
          yearlyBudget {
            valueInCents
            currency
          }
          contributorsCount
        }
      }
    }
    events: accounts(
      parent: { slug: $slug }
      type: [EVENT]
      isActive: true
      orderBy: { field: BALANCE, direction: DESC }
    ) {
      totalCount
      nodes {
        id
        name
        description
        type
        slug
        settings
        currency
        stats {
          totalAmountReceived {
            valueInCents
            currency
          }
          yearlyBudget {
            valueInCents
            currency
          }
          contributorsCount
        }
      }
    }
  }
`;

export const goalProgressQuery = gql`
  query GoalProgress($slug: String!, $oneYearAgo: DateTime, $thisMonthStart: DateTime, $thisYearStart: DateTime) {
    account(slug: $slug) {
      id
      slug
      type
      currency
      ... on AccountWithContributions {
        activeContributors(limit: 5) {
          totalCount
          limit
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
        activeContributorsForBudgetGoal: activeContributors(
          includeActiveRecurringContributions: true
          dateFrom: $oneYearAgo
          limit: 5
        ) {
          totalCount
          limit
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
        activeContributorsForYearlyBudget: activeContributors(
          includeActiveRecurringContributions: true
          dateFrom: $oneYearAgo
          limit: 5
        ) {
          totalCount
          limit
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
        activeContributorsForCalendarYear: activeContributors(dateFrom: $thisYearStart, limit: 5) {
          totalCount
          limit
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
        activeContributorsForCalendarMonth: activeContributors(dateFrom: $thisMonthStart, limit: 5) {
          totalCount
          limit
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
      }

      stats {
        yearlyBudget {
          valueInCents
          currency
        }
        totalAmountReceived(net: true) {
          valueInCents
          currency
        }
        totalAmountReceivedThisMonth: totalAmountReceived(net: true, dateFrom: $thisMonthStart) {
          valueInCents
          currency
        }
        totalAmountReceivedThisYear: totalAmountReceived(net: true, dateFrom: $thisYearStart) {
          valueInCents
          currency
        }
      }
      members(role: [BACKER], limit: 5) {
        totalCount
        limit
        nodes {
          id
          account {
            id
            name
            slug
            type
            imageUrl
          }
        }
      }
    }
  }
`;

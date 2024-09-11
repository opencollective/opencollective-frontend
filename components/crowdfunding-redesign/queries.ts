import { gql } from '@apollo/client';

export const profilePageQuery = gql`
  query ProfilePage($slug: String!, $includeChildren: Boolean!) {
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
      expenses(limit: 20, direction: RECEIVED, status: PAID, includeChildrenExpenses: $includeChildren) {
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

import { gql } from '@apollo/client';

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
            interval
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
        activeRecurringContributionsBreakdown {
          label
          amount {
            valueInCents
            currency
          }
          count
        }

        contributorsCount
      }
    }
  }
`;

import { gqlV2 } from '../../../lib/graphql/helpers';

export const recurringContributionsQuery = gqlV2/* GraphQL */ `
  query RecurringContributions($slug: String) {
    account(slug: $slug) {
      id
      slug
      name
      type
      settings
      imageUrl
      orders(filter: OUTGOING, onlySubscriptions: true) {
        totalCount
        nodes {
          id
          paymentMethod {
            id
          }
          amount {
            value
            valueInCents
            currency
          }
          status
          frequency
          tier {
            id
            name
          }
          totalDonations {
            value
            valueInCents
            currency
          }
          toAccount {
            id
            slug
            name
            type
            description
            tags
            imageUrl
            settings
          }
          platformContributionAmount {
            value
            valueInCents
          }
        }
      }
    }
  }
`;

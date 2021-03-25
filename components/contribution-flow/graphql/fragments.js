import { gqlV2 } from '../../../lib/graphql/helpers';

const contributionFlowHostFieldsFragment = gqlV2/* GraphQL */ `
  fragment ContributionFlowHostFields on Host {
    id
    legacyId
    slug
    name
    settings
    contributionPolicy
    location {
      country
    }
    paypalClientId
    supportedPaymentMethods
    payoutMethods {
      id
      name
      data
      type
    }
    plan {
      id
      name
      platformTips
    }
  }
`;

export const contributionFlowAccountFieldsFragment = gqlV2/* GraphQL */ `
  fragment ContributionFlowAccountFields on Account {
    id
    legacyId
    slug
    type
    name
    currency
    settings
    twitterHandle
    description
    imageUrl(height: 192)
    isHost
    isActive
    settings
    location {
      country
    }
    ... on Organization {
      platformFeePercent
      platformContributionAvailable
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on AccountWithContributions {
      contributionPolicy
      platformFeePercent
      platformContributionAvailable
      contributors(limit: 6) {
        totalCount
        nodes {
          id
          name
          image
          collectiveSlug
        }
      }
    }
    ... on AccountWithHost {
      hostFeePercent
      host {
        ...ContributionFlowHostFields
      }
    }
    ... on Event {
      parent {
        id
        slug
        settings
        location {
          country
        }
      }
    }
    ... on Project {
      parent {
        id
        slug
        settings
        location {
          country
        }
      }
    }
  }
  ${contributionFlowHostFieldsFragment}
`;

const orderSuccessHostFragment = gqlV2/* GraphQL */ `
  fragment OrderSuccessHostFragment on Host {
    id
    slug
    settings
    bankAccount {
      id
      name
      data
      type
    }
  }
`;

export const orderSuccessFragment = gqlV2/* GraphQL */ `
  fragment OrderSuccessFragment on Order {
    id
    legacyId
    status
    frequency
    amount {
      value
      currency
    }
    paymentMethod {
      id
      service
      type
    }
    platformContributionAmount {
      value
    }
    tier {
      id
      name
    }
    membership {
      id
      publicMessage
    }
    fromAccount {
      id
      name
      ... on Individual {
        isGuest
      }
    }
    toAccount {
      id
      name
      slug
      tags
      type
      isHost
      settings
      ... on AccountWithContributions {
        contributors {
          totalCount
        }
      }
      ... on AccountWithHost {
        host {
          ...OrderSuccessHostFragment
        }
      }
      ... on Organization {
        host {
          ...OrderSuccessHostFragment
          ... on AccountWithContributions {
            contributors {
              totalCount
            }
          }
        }
      }
    }
  }
  ${orderSuccessHostFragment}
`;

export const orderResponseFragment = gqlV2/* GraphQL */ `
  fragment OrderResponseFragment on OrderWithPayment {
    guestToken
    order {
      ...OrderSuccessFragment
    }
    stripeError {
      message
      account
      response
    }
  }
  ${orderSuccessFragment}
`;

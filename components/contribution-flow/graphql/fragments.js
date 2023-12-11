import { gql } from '@apollo/client';

const contributionFlowHostFieldsFragment = gql`
  fragment ContributionFlowHostFields on Host {
    id
    legacyId
    slug
    name
    settings
    contributionPolicy
    location {
      id
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
  }
`;

export const contributionFlowAccountFieldsFragment = gql`
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
    backgroundImageUrl
    isHost
    isActive
    settings
    location {
      id
      country
    }
    features {
      id
      RECEIVE_FINANCIAL_CONTRIBUTIONS
    }
    ... on Organization {
      platformFeePercent
      platformContributionAvailable
      host {
        id
        ...ContributionFlowHostFields
      }
    }
    ... on AccountWithContributions {
      contributionPolicy
      platformFeePercent
      platformContributionAvailable
      contributors(limit: 6, roles: [BACKER, ATTENDEE]) {
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
        id
        ...ContributionFlowHostFields
      }
    }
    ... on AccountWithParent {
      parent {
        id
        slug
        name
        settings
        imageUrl
        backgroundImageUrl
        location {
          id
          country
        }
        ... on AccountWithContributions {
          contributionPolicy
        }
      }
    }
    ... on Event {
      endsAt
    }
  }
  ${contributionFlowHostFieldsFragment}
`;

const orderSuccessHostFragment = gql`
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

export const orderSuccessFragment = gql`
  fragment OrderSuccessFragment on Order {
    id
    legacyId
    status
    frequency
    data
    amount {
      value
      valueInCents
      currency
    }
    paymentMethod {
      id
      service
      type
      data
    }
    platformTipAmount {
      value
      valueInCents
      currency
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
      type
      slug
      imageUrl(height: 48)
      isIncognito
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
      socialLinks {
        type
      }
      stats {
        id
        contributorsCount
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          tags
          socialLinks {
            type
          }
        }
      }
      ... on AccountWithHost {
        host {
          id
          ...OrderSuccessHostFragment
        }
      }
      ... on Organization {
        host {
          id
          ...OrderSuccessHostFragment
        }
      }
    }
  }
  ${orderSuccessHostFragment}
`;

export const orderResponseFragment = gql`
  fragment OrderResponseFragment on OrderWithPayment {
    guestToken
    order {
      id
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

import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';

import { collectiveNavbarFieldsFragment } from '../../components/collective-page/graphql/fragments';

import { API_V2_CONTEXT, gqlV2 } from './helpers';

export const transactionFieldsFragment = gql`
  fragment TransactionFields on Transaction {
    id
    uuid
    description
    createdAt
    type
    amount
    currency
    hostCurrency
    hostCurrencyFxRate
    netAmountInCollectiveCurrency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    taxAmount
    paymentProcessorFeeInHostCurrency
    paymentMethod {
      service
      type
      name
      data
    }
    collective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
    }
    fromCollective {
      id
      name
      slug
      path
      type
      imageUrl
      isIncognito
    }
    usingGiftCardFromCollective {
      id
      slug
      name
      type
    }
    host {
      id
      slug
      name
      currency
      hostFeePercent
      type
    }
    ... on Expense {
      expense {
        id
        tags
      }
    }
    ... on Order {
      createdAt
      subscription {
        interval
      }
    }
  }
`;

export const transactionsQuery = gql`
  query Transactions(
    $CollectiveId: Int!
    $type: String
    $limit: Int
    $offset: Int
    $dateFrom: String
    $dateTo: String
    $kinds: [String]
  ) {
    allTransactions(
      CollectiveId: $CollectiveId
      type: $type
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      kinds: $kinds
    ) {
      ...TransactionFields
      refundTransaction {
        ...TransactionFields
      }
    }
  }

  ${transactionFieldsFragment}
`;

export const loggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id
      username
      firstName
      lastName
      email
      image
      isLimited
      CollectiveId
      collective {
        id
        name
        type
        slug
        imageUrl
        settings
        currency
        isDeletable
        categories
        location {
          country
        }
        payoutMethods {
          id
          type
          name
          isSaved
        }
        connectedAccounts {
          service
        }
      }
      memberOf {
        id
        role
        collective {
          id
          slug
          type
          isIncognito
          name
          currency
          isHost
          endsAt
          imageUrl
          categories
          host {
            id
          }
          settings
        }
      }
    }
  }
`;

export const editCollectivePageFieldsFragment = gql`
  fragment EditCollectivePageFields on CollectiveInterface {
    id
    type
    slug
    isActive
    host {
      id
      createdAt
      slug
      name
      currency
      settings
      description
      website
      twitterHandle
      imageUrl
      backgroundImage
      hostCollective {
        id
        slug
        name
        currency
      }
      location {
        country
      }
      stats {
        id
        collectives {
          hosted
        }
      }
    }
    name
    company
    image # We still query 'image' because it's required for the edition
    imageUrl
    backgroundImage
    description
    longDescription
    location {
      name
      address
      country
      lat
      long
    }
    privateInstructions
    tags
    twitterHandle
    githubHandle
    website
    currency
    settings
    createdAt
    isActive
    isArchived
    isApproved
    isDeletable
    isHost
    hasVirtualCards
    hostFeePercent
    expensePolicy
    contributionPolicy
    stats {
      id
      yearlyBudget
      balance
      backers {
        all
      }
      totalAmountSpent
    }
    tiers {
      id
      slug
      type
      name
      description
      useStandalonePage
      longDescription
      amount
      presets
      amountType
      minimumAmount
      goal
      interval
      currency
      maxQuantity
      button
    }
    members(roles: ["ADMIN", "MEMBER", "HOST"]) {
      id
      createdAt
      since
      role
      description
      stats {
        totalDonations
      }
      tier {
        id
        name
      }
      member {
        id
        name
        imageUrl
        slug
        twitterHandle
        description
        ... on User {
          email
        }
      }
    }
    paymentMethods(types: ["creditcard", "giftcard", "prepaid"], hasBalanceAboveZero: true) {
      id
      uuid
      name
      data
      monthlyLimitPerMember
      service
      type
      balance
      currency
      expiryDate
      orders(hasActiveSubscription: true) {
        id
      }
    }
    connectedAccounts {
      id
      service
      username
      createdAt
      settings
      updatedAt
    }
    plan {
      id
      hostDashboard
      hostedCollectives
      hostFees
      hostFeeSharePercent
      manualPayments
      name
    }
    parentCollective {
      id
      slug
    }
    features {
      ...NavbarFields
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const editCollectivePageQuery = gql`
  query EditCollectivePage($slug: String) {
    Collective(slug: $slug) {
      ...EditCollectivePageFields
    }
  }

  ${editCollectivePageFieldsFragment}
`;

export const legacyCollectiveQuery = gql`
  query LegacyCollective($slug: String) {
    Collective(slug: $slug) {
      id
      isActive
      isPledged
      type
      slug
      path
      name
      company
      imageUrl
      backgroundImage
      description
      longDescription
      location {
        name
        address
        country
        lat
        long
      }
      twitterHandle
      githubHandle
      website
      currency
      settings
      createdAt
      stats {
        id
        balance
        yearlyBudget
        backers {
          all
          users
          organizations
          collectives
        }
        collectives {
          hosted
          memberOf
        }
        transactions {
          id
          all
        }
        expenses {
          id
          all
        }
        updates
        events
        totalAmountSpent
        totalAmountReceived
      }
      tiers {
        id
        slug
        type
        name
        description
        useStandalonePage
        button
        amount
        amountType
        minimumAmount
        presets
        interval
        currency
        maxQuantity
        stats {
          id
          totalOrders
          totalActiveDistinctOrders
          availableQuantity
        }
        orders(limit: 30, isActive: true) {
          fromCollective {
            id
            slug
            type
            name
            imageUrl
            website
            isIncognito
          }
        }
      }
      isHost
      hostFeePercent
      canApply
      isArchived
      isApproved
      isDeletable
      host {
        id
        slug
        name
        imageUrl
      }
      members {
        id
        role
        createdAt
        since
        description
        member {
          id
          description
          name
          slug
          type
          imageUrl
          backgroundImage
          isIncognito
          company
        }
      }
      ... on User {
        isIncognito
        memberOf(limit: 60) {
          id
          role
          createdAt
          stats {
            totalDonations
          }
          collective {
            id
            name
            currency
            slug
            path
            type
            imageUrl
            backgroundImage
            description
            longDescription
            parentCollective {
              slug
            }
          }
        }
      }
      ... on Organization {
        memberOf(limit: 60) {
          id
          role
          createdAt
          stats {
            totalDonations
          }
          collective {
            id
            name
            currency
            slug
            path
            type
            imageUrl
            backgroundImage
            description
            longDescription
            parentCollective {
              slug
            }
          }
        }
      }
    }
  }
`;

export const subscriptionsQuery = gql`
  query Subscriptions($slug: String) {
    Collective(slug: $slug) {
      id
      type
      slug
      name
      company
      imageUrl
      backgroundImage
      description
      twitterHandle
      website
      currency
      settings
      createdAt
      stats {
        id
        totalAmountSpent
      }
      ordersFromCollective(subscriptionsOnly: true) {
        id
        currency
        totalAmount
        interval
        createdAt
        isSubscriptionActive
        isPastDue
        status
        collective {
          id
          name
          currency
          slug
          type
          imageUrl
          backgroundImage
          description
          longDescription
        }
        fromCollective {
          id
          slug
        }
        paymentMethod {
          id
          uuid
          currency
          name
          service
          type
          data
          balance
          expiryDate
        }
      }
      paymentMethods {
        id
        uuid
        currency
        name
        service
        type
        data
        balance
        expiryDate
      }
      ... on User {
        memberOf(limit: 60) {
          id
          role
          createdAt
          stats {
            totalDonations
          }
          collective {
            id
          }
        }
      }

      ... on Organization {
        memberOf(limit: 60) {
          id
          role
          createdAt
          stats {
            totalDonations
          }
          collective {
            id
          }
        }
      }
    }
  }
`;

export const collectiveNavbarQuery = gqlV2`
  query CollectiveNavbar($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      imageUrl(height: 256)
      features {
        ...NavbarFields
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const addCollectiveNavbarData = component => {
  return graphql(collectiveNavbarQuery, { options: { context: API_V2_CONTEXT } })(component);
};

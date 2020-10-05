import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';

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
    usingVirtualCardFromCollective {
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
        category
        attachment
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
  ) {
    allTransactions(
      CollectiveId: $CollectiveId
      type: $type
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
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
      paypalEmail
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
        paymentMethods(limit: 10, hasBalanceAboveZero: true) {
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
          stats {
            id
            balance
          }
          paymentMethods(limit: 10, hasBalanceAboveZero: true) {
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
    createdByUser {
      id
    }
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
    paymentMethods(types: ["creditcard", "virtualcard", "prepaid"], hasBalanceAboveZero: true) {
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
      addedFunds
      addedFundsLimit
      bankTransfers
      bankTransfersLimit
      hostDashboard
      hostedCollectives
      hostedCollectivesLimit
      transferwisePayouts
      transferwisePayoutsLimit
      manualPayments
      name
    }
    parentCollective {
      id
      slug
    }
  }
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
      createdByUser {
        id
      }
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
        hasLongDescription
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

const collectiveCoverQuery = gql`
  query CollectiveCover($slug: String, $throwIfMissing: Boolean) {
    Collective(slug: $slug, throwIfMissing: $throwIfMissing) {
      id
      type
      slug
      path
      name
      currency
      settings
      imageUrl
      isIncognito
      backgroundImage
      isHost
      isActive
      isArchived
      canApply
      tags
      canContact
      stats {
        id
        balance
        updates
        events
        yearlyBudget
        totalAmountReceived
        backers {
          all
        }
      }
      createdByUser {
        id
      }
      ... on Collective {
        host {
          id
          slug
          name
          imageUrl
          settings
          plan {
            name
            transferwisePayouts
            transferwisePayoutsLimit
          }
        }
      }
      ... on Event {
        host {
          id
          slug
          name
          imageUrl
          settings
          plan {
            name
            transferwisePayouts
            transferwisePayoutsLimit
          }
        }
      }
      parentCollective {
        id
        slug
        name
      }
      location {
        name
      }
      members {
        id
        role
        createdAt
        description
        member {
          id
          description
          name
          slug
          type
          isIncognito
          imageUrl
        }
      }
      plan {
        hostDashboard
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
      createdByUser {
        id
      }
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
          createdByUser {
            id
          }
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

export const hostPendingApplicationsQuery = gql`
  query HostPendingApplications($hostCollectiveSlug: String!) {
    Collective(slug: $hostCollectiveSlug) {
      id
      slug
      name
      pending: collectives(isActive: false, isArchived: false, orderBy: createdAt, orderDirection: DESC) {
        collectives {
          id
          slug
          name
          githubHandle
          type
          isActive
          isApproved
          host {
            id
          }
        }
      }
    }
  }
`;

export const addCollectiveCoverData = (component, options) => {
  return graphql(collectiveCoverQuery, options)(component);
};

export const invoicesQuery = gql`
  query TransactionsDownloadInvoices($fromCollectiveSlug: String!) {
    allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
      slug
      year
      month
      totalAmount
      currency
      fromCollective {
        slug
      }
      host {
        slug
        name
        imageUrl
      }
    }
  }
`;

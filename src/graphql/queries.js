import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export const transactionFields = `
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
    type
    name
  }
  fromCollective {
    id
    name
    slug
    path
    image
  }
  usingVirtualCardFromCollective {
    id
    slug
    name
  }
  host {
    id
    slug
    name
    currency
    hostFeePercent
  }
  ... on Expense {
    category
    attachment
  }
  ... on Order {
    createdAt
    subscription {
      interval
    }
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
export const getTransactionsQuery = gql`
query Transactions($CollectiveId: Int!, $type: String, $limit: Int, $offset: Int, $dateFrom: String, $dateTo: String) {
  allTransactions(CollectiveId: $CollectiveId, type: $type, limit: $limit, offset: $offset, dateFrom: $dateFrom, dateTo: $dateTo) {
    ${transactionFields}
    refundTransaction {
      ${transactionFields}
    }
  }
}
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

export const getLoggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id
      username
      firstName
      lastName
      email
      emailWaitingForValidation
      paypalEmail
      image
      CollectiveId
      collective {
        id
        name
        type
        slug
        settings
        currency
        isDeletable
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
          name
          currency
          isHost
          image
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

const getTiersQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      name
      image
      backgroundImage
      twitterHandle
      description
      currency
      settings
      location {
        country
      }
      tiers {
        id
        type
        name
        description
        amount
        minimumAmount
        currency
        interval
      }
    }
  }
`;

export const getCollectiveToEditQueryFields = `
  id
  type
  slug
  createdByUser {
    id
  }
  host {
    id
    createdAt
    slug
    name
    currency
    image
    backgroundImage
    settings
    description
    website
    twitterHandle
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
  image
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
  isDeletable
  isHost
  hostFeePercent
  expensePolicy
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
    amount
    presets
    minimumAmount
    interval
    currency
    maxQuantity
  }
  memberOf {
    id
    createdAt
    role
    stats {
      totalDonations
    }
    tier {
      id
      name
    }
    collective {
      id
      type
      slug
      name
      currency
      description
      settings
      image
      stats {
        id
        backers {
          all
        }
        yearlyBudget
      }
    }
  }
  members(roles: ["ADMIN", "MEMBER", "HOST"]) {
    id
    createdAt
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
      image
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
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const getCollectiveToEditQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      ${getCollectiveToEditQueryFields}
    }
  }
`;
/* eslint-enable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const getCollectiveQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      isActive
      type
      slug
      path
      createdByUser {
        id
      }
      name
      company
      image
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
        totalAmountRaised
        totalAmountReceived
      }
      tiers {
        id
        slug
        type
        name
        description
        button
        amount
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
            image
            website
          }
        }
      }
      isHost
      hostFeePercent
      canApply
      isArchived
      isDeletable
      host {
        id
        slug
        name
        image
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
          image
          backgroundImage
          company
        }
      }
      ... on User {
        memberOf(limit: 60) {
          id
          role
          createdAt
          stats {
            totalDonations
            totalRaised
          }
          collective {
            id
            name
            currency
            slug
            path
            type
            image
            description
            longDescription
            backgroundImage
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
            totalRaised
          }
          collective {
            id
            name
            currency
            slug
            path
            type
            image
            description
            longDescription
            backgroundImage
            parentCollective {
              slug
            }
          }
        }
      }
      pledges: orders(status: PENDING) {
        currency
        id
        interval
        publicMessage
        status
        totalAmount
        fromCollective {
          name
          image
          slug
          type
        }
      }
    }
  }
`;

const getEventCollectiveQuery = gql`
  query Collective($eventSlug: String) {
    Collective(slug: $eventSlug) {
      id
      type
      slug
      path
      createdByUser {
        id
      }
      name
      image
      backgroundImage
      description
      longDescription
      startsAt
      endsAt
      timezone
      currency
      settings
      location {
        name
        address
        country
        lat
        long
      }
      tiers {
        id
        slug
        type
        name
        description
        amount
        minimumAmount
        presets
        currency
        maxQuantity
        stats {
          id
          availableQuantity
        }
      }
      parentCollective {
        id
        slug
        name
        mission
        currency
        backgroundImage
        image
        settings
      }
      stats {
        id
        balance
        expenses {
          id
          all
        }
        transactions {
          id
          all
        }
      }
      members {
        id
        createdAt
        role
        member {
          id
          name
          image
          slug
          twitterHandle
          description
        }
      }
      orders {
        id
        createdAt
        quantity
        publicMessage
        fromCollective {
          id
          name
          company
          image
          slug
          twitterHandle
          description
          ... on User {
            email
          }
        }
        tier {
          id
          name
        }
      }
    }
  }
`;

const getCollectiveCoverQuery = gql`
  query CollectiveCover($slug: String) {
    Collective(slug: $slug) {
      id
      type
      slug
      path
      name
      currency
      backgroundImage
      settings
      image
      isHost
      isActive
      tags
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
      host {
        id
        slug
        name
        image
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
          image
        }
      }
    }
  }
`;

export const getSubscriptionsQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      type
      slug
      createdByUser {
        id
      }
      name
      company
      image
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
        totalAmountRaised
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
          image
          description
          longDescription
          backgroundImage
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
            totalRaised
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
            totalRaised
          }
          collective {
            id
          }
        }
      }
    }
  }
`;

/** A query to get the virtual cards created by a collective. Must be authenticated. */
export const getCollectiveVirtualCards = gql`
  query CollectiveVirtualCards($CollectiveId: Int, $isConfirmed: Boolean, $limit: Int, $offset: Int) {
    Collective(id: $CollectiveId) {
      createdVirtualCards(isConfirmed: $isConfirmed, limit: $limit, offset: $offset) {
        offset
        limit
        total
        paymentMethods {
          id
          uuid
          currency
          name
          service
          type
          data
          initialBalance
          monthlyLimitPerMember
          balance
          expiryDate
          isConfirmed
          data
          createdAt
          expiryDate
          description
          collective {
            id
            slug
            image
            type
            name
          }
        }
      }
    }
  }
`;

export const searchCollectivesQuery = gql`
  query search($term: String!, $limit: Int, $offset: Int) {
    search(term: $term, limit: $limit, offset: $offset) {
      collectives {
        id
        isActive
        type
        slug
        path
        name
        company
        image
        backgroundImage
        description
        longDescription
        website
        currency
        stats {
          id
          balance
          totalAmountSpent
          yearlyBudget
          backers {
            all
          }
        }
        memberOf(role: "BACKER") {
          id
        }
      }
      limit
      offset
      total
    }
  }
`;

export const getCollectiveApplicationsQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      ... on User {
        applications {
          id
          type
          name
          description
          callbackUrl
          apiKey
          clientId
          clientSecret
        }
      }
    }
  }
`;

/**
 * A query to get a collective source payment methods. This will not return
 * virtual cards, as a virtual card cannot be used as a source payment method
 * for another payment method.
 */
export const getCollectiveSourcePaymentMethodsQuery = gql`
  query Collective($id: Int) {
    Collective(id: $id) {
      id
      paymentMethods(types: ["creditcard", "prepaid"], hasBalanceAboveZero: true) {
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
      }
    }
  }
`;

export const addCollectiveData = graphql(getCollectiveQuery);
export const addCollectiveCoverData = (component, options) => {
  return graphql(getCollectiveCoverQuery, options)(component);
};
export const addCollectiveToEditData = (component, options) => {
  return graphql(getCollectiveToEditQuery, options)(component);
};
export const addEventCollectiveData = graphql(getEventCollectiveQuery);
export const addTiersData = graphql(getTiersQuery);
export const addSubscriptionsData = graphql(getSubscriptionsQuery);
export const addSearchQueryData = graphql(searchCollectivesQuery);

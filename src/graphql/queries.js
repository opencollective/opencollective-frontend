import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import withLoggedInUser from '../lib/withLoggedInUser';

export const transactionFields = `
  id
  uuid
  description
  createdAt
  type
  amount
  currency
  netAmountInCollectiveCurrency
  hostFeeInHostCurrency
  platformFeeInHostCurrency
  paymentProcessorFeeInHostCurrency
  paymentMethod {
    service
  }
  fromCollective {
    id
    name
    slug
    image
  }
  host {
    id
    name
    currency
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

export const getLoggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id
      username
      firstName
      lastName
      email
      paypalEmail
      image
      CollectiveId
      collective {
        id
        name
        type
        slug
        settings
        paymentMethods(limit: 5) {
          id
          uuid
          service
          name
          data
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
          paymentMethods(limit: 5) {
            id
            uuid
            name
            service
            type
            data
            balance
            expiryDate
          }
        }
      }
    }
  }
`;

const getTiersQuery = gql`
  query Collective($slug: String!) {
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
      tiers {
        id
        type
        name
        description
        amount
        currency
        interval
      }
    }
  }
`;

const getCollectiveToEditQuery = gql`
  query Collective($slug: String!) {
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
      longDescription
      tags
      twitterHandle
      website
      currency
      settings
      createdAt
      isHost
      expensePolicy
      stats {
        id
        yearlyBudget
        backers {
          all
        }
        totalAmountSent
      }
      tiers {
        id
        slug
        type
        name
        description
        amount
        presets
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
      members(roles: ["ADMIN", "MEMBER"]) {
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
      paymentMethods(service: "stripe") {
        id
        uuid
        name
        data
        monthlyLimitPerMember
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
    }
  }
`;

const getCollectiveQuery = gql`
  query Collective($slug: String!) {
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
      twitterHandle
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
        totalAmountSent
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
        presets
        interval
        currency
        maxQuantity
        stats {
          id
          totalOrders
          availableQuantity
        }
        orders(limit: 30) {
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
      canApply
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
          }
        }
      }
    }
  }
`;

const getEventCollectiveQuery = gql`
  query Collective($eventSlug: String!) {
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
        currency
        maxQuantity
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
  query CollectiveCover($slug: String!) {
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

export const getOcCardBalanceQuery = gql`
  query checkOcPaymentMethod($token: String!) {
    ocPaymentMethod(token: $token) {
      id,
      name,
      currency,
      balance,
      uuid
      service
      type
    }
  }
`;

export const getSubscriptionsQuery = gql`
  query Collective($slug: String!) {
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
        totalAmountSent
        totalAmountRaised
      }
      ordersFromCollective (subscriptionsOnly: true) {
        id
        currency
        totalAmount
        interval
        createdAt
        isSubscriptionActive
        isPastDue
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
          data
          name
        }
      }
      paymentMethods {
        id
        uuid
        service
        type
        data
        name
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
          totalAmountSent
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

export const addCollectiveData = graphql(getCollectiveQuery);
export const addCollectiveCoverData = graphql(getCollectiveCoverQuery, {
  options(props) {
    return {
      variables: {
        slug: props.collectiveSlug || props.slug
      }
    }
  }
});
export const addCollectiveToEditData = graphql(getCollectiveToEditQuery);
export const addEventCollectiveData = graphql(getEventCollectiveQuery);
export const addTiersData = graphql(getTiersQuery);
export const addSubscriptionsData = graphql(getSubscriptionsQuery);
export const addSearchQueryData = graphql(searchCollectivesQuery);

export const addGetLoggedInUserFunction = component => {
  if (process.env.NODE_ENV == 'development') {
    console.warn('addGetLoggedInUserFunction is deprecated, use withLoggedInUser instead');
  }
  return withLoggedInUser(component);
}

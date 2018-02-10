import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { intersection, get } from 'lodash';
import LoggedInUser from '../classes/LoggedInUser';
import storage from '../lib/storage';

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
          stats {
            id
            balance
          }
          paymentMethods(limit: 5) {
            id
            uuid
            name
            service
            data
            balance
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
      twitterHandle
      website
      currency
      settings
      createdAt
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
        transactions
        expenses {
          id
          all
        }
        updates
        events
        totalAmountSent
        totalAmountRaised
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
        processedAt
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
      name
      currency
      backgroundImage
      settings
      image
      isHost
      tags
      stats {
        id
        balance
        updates
        events
        yearlyBudget
      }
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
    }
  }
`;

export const getPrepaidCardBalanceQuery = gql`
  query checkPrepaidPaymentMethod($token: String!) {
    prepaidPaymentMethod(token: $token) {
      id,
      name,
      currency,
      balance,
      uuid
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

const refreshLoggedInUser = async (data) => {
  let res;
  const startTime = new Date;

  if (data.LoggedInUser) {
    const user = new LoggedInUser(data.LoggedInUser);
    console.info(`>>> LoggedInUser was already in data`);
    storage.set("LoggedInUser", user, 1000 * 60 * 60);
    return user;
  }

  try {
    res = await data.refetch();
    if (!res.data || !res.data.LoggedInUser) {
      storage.set("LoggedInUser", null);
      return null;
    }
    const user = new LoggedInUser(res.data.LoggedInUser);
    const endTime = new Date;
    const elapsedTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    console.info(`>>> LoggedInUser fetched in ${elapsedTime} seconds`);
    storage.set("LoggedInUser", user, 1000 * 60 * 60);
    return user;
  } catch (e) {
    console.error(">>> getLoggedInUser error:", e);
    storage.set("LoggedInUser", null);
    return null;
  }
};

export const addGetLoggedInUserFunction = (component) => {
  const accessToken = typeof window !== 'undefined' && window.localStorage.getItem('accessToken');
  if (!accessToken) return component;
  return graphql(getLoggedInUserQuery, {
    props: ({ data }) => ({
      data,
      getLoggedInUser: async () => {
        if (!window.localStorage.getItem('accessToken')) {
          storage.set("LoggedInUser", null);
          return null;
        }
        const cache = storage.get("LoggedInUser");
        if (cache) {
          refreshLoggedInUser(data); // we don't wait.
          return new LoggedInUser(cache);
        }
        return await refreshLoggedInUser(data);
      }
    })
  })(component);
}
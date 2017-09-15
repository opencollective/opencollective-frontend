import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export const getLoggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id
      username
      firstName
      lastName
      email
      image
      CollectiveId
      collective {
        id
        name
        type
        paymentMethods {
          uuid
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
          balance
          currency
          paymentMethods {
            uuid
            name
            data
            balance
          }
        }
      }
    }
  }
`;

export const getUserQuery = gql`
  query User($username: String!) {
    User(username: $username) {
      id
      username
      firstName
      lastName
      twitterHandle
      description
      organization
      website
      email
      image
      collectives {
        id
        slug
        name
        role
        memberSince
        totalDonations
        tier {
          id
          name
          amount
          currency
          interval
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
        backers
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
        orders {
          id
          publicMessage
          createdAt
          totalTransactions
          fromCollective {
            id
            name
            image
            slug
            twitterHandle
            description
          }
        }
      }
      memberOf {
        id
        createdAt
        role
        totalDonations
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
            backers
            yearlyBudget
          }
        }
      }
      members {
        id
        createdAt
        role
        totalDonations
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
      paymentMethods {
        id
        uuid
        name
        data
      }
      connectedAccounts {
        id
        service
        username
        createdAt
      }
    }
  }
`;

const getCollectiveQuery = gql`
  query Collective($slug: String!) {
    Collective(slug: $slug) {
      id
      type
      slug
      createdByUser {
        id
      }
      name
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
        backers
        transactions
        expenses
        totalAmountSent
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
      }
      memberOf {
        id
        createdAt
        role
        totalDonations
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
            backers
            yearlyBudget
          }
        }
      }
      members {
        id
        createdAt
        role
        totalDonations
        tier {
          id
          name
          currency
        }
        member {
          id
          name
          type
          image
          slug
          twitterHandle
          description
          ... on User {
            email
          }
        }
      }
    }
  }
`;

const getEventCollectiveQuery = gql`
  query Collective($slug: String!) {
    Collective(slug: $slug) {
      id
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
          image
          slug
          twitterHandle
          description
        }
        tier {
          id
          name
        }
      }
    }
  }
`;

const getEventsQuery = gql`
  query allEvents($parentCollectiveSlug: String) {
    allEvents(slug: $parentCollectiveSlug) {
      id
      slug
      name
      description
      longDescription
      startsAt
      endsAt
      timezone
      location {
        name
        address
        lat
        long
      }
      tiers {
        id
        type
        name
        description
        amount
      }
      parentCollective {
        id
        slug
        name
        mission
        backgroundImage
        image
      }
    }
  }
`;

const getAttendeesQuery = gql`
  query Collective($slug: String!) {
    Collective(slug: $slug) {
      slug
      name
      startsAt
      location {
        name
        address
      }
      orders {
        id
        createdAt
        quantity
        processedAt
        description
        user {
          id
          firstName
          lastName
          image
          username
          twitterHandle
          description
        }
        tier {
          id
          name
        }
      }
    }
  }
`;

const getCollectiveTierQuery = gql`
  query CollectiveTier($slug: String! $TierId: Int!) {
    Collective(slug: $slug) {
      id
      slug
      name
      image
      description
      twitterHandle
      currency
      backgroundImage
      settings
      image
    }
    Tier(id: $TierId) {
      id
      type
      name
      description
      amount
      currency
      interval
      presets
    }
  }
`;

const getCollectiveCoverQuery = gql`
  query CollectiveCover($slug: String!) {
    Collective(slug: $slug) {
      id
      slug
      name
      currency
      backgroundImage
      settings
      image
    }
  }
`;

export const addCollectiveData = graphql(getCollectiveQuery);
export const addCollectiveCoverData = graphql(getCollectiveCoverQuery);
export const addCollectiveToEditData = graphql(getCollectiveToEditQuery);
export const addEventCollectiveData = graphql(getEventCollectiveQuery);
export const addCollectiveTierData = graphql(getCollectiveTierQuery);
export const addEventsData = graphql(getEventsQuery);
export const addAttendeesData = graphql(getAttendeesQuery);
export const addTiersData = graphql(getTiersQuery);
export const addUserData = graphql(getUserQuery);

export const addGetLoggedInUserFunction = (component) => {
  const accessToken = typeof window !== 'undefined' && window.localStorage.getItem('accessToken');
  if (!accessToken) return component;
  return graphql(getLoggedInUserQuery, {
    props: ({ data }) => ({
      data,
      getLoggedInUser: () => {
        if (window.localStorage.getItem('accessToken')) {
          return new Promise(async (resolve) => {
              let res;
              try {
                res = await data.refetch();
                if (res.data && res.data.LoggedInUser) {
                  const LoggedInUser = {...res.data.LoggedInUser};
                  if (LoggedInUser && LoggedInUser.memberOf) {
                    const roles = {};
                    LoggedInUser.memberOf.map(member => {
                      roles[member.collective.slug] = roles[member.collective.slug] || [];
                      roles[member.collective.slug].push(member.role);
                    });
                    LoggedInUser.roles = roles;
                  }
                  console.log(">>> LoggedInUser", LoggedInUser);
                  return resolve(LoggedInUser);
                }
              } catch (e) {
                console.error(">>> getLoggedInUser error : ", e);
                return resolve(null);
              }
          });
        }
      }
    })
  })(component);
}
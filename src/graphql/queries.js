import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { intersection, get } from 'lodash';

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
            expenses {
              id
              pending
            }
          }
          paymentMethods {
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
      members(roles: ["ADMIN", "MEMBER"]) {
        id
        createdAt
        role
        description
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
        monthlyLimitPerMember
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
      isActive
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
        balance
        yearlyBudget
        backers
        sponsors
        collectives
        transactions
        expenses {
          id
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
        orders(limit: 5) {
          fromCollective {
            id
            slug
            type
            name
            image
          }
        }
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
        memberOf {
          id
          role
          createdAt
          totalDonations
          collective {
            id
            name
            currency
            slug
            type
            image
            description
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
    }
  }
`;

export const addCollectiveData = graphql(getCollectiveQuery);
export const addCollectiveCoverData = graphql(getCollectiveCoverQuery);
export const addCollectiveToEditData = graphql(getCollectiveToEditQuery);
export const addEventCollectiveData = graphql(getEventCollectiveQuery);
export const addTiersData = graphql(getTiersQuery);
export const addUserData = graphql(getUserQuery);

export const addGetLoggedInUserFunction = (component) => {
  const accessToken = typeof window !== 'undefined' && window.localStorage.getItem('accessToken');
  if (!accessToken) return component;
  return graphql(getLoggedInUserQuery, {
    props: ({ data }) => ({
      data,
      getLoggedInUser: () => {
        if (!window.localStorage.getItem('accessToken')) {
          return Promise.resolve(null);
        }
        return new Promise(async (resolve) => {
            let res;
            try {
              res = await data.refetch();
              if (!res.data || !res.data.LoggedInUser) {
                return resolve(null);
              }
              const LoggedInUser = {...res.data.LoggedInUser};
              if (LoggedInUser && LoggedInUser.memberOf) {
                const roles = {};
                LoggedInUser.memberOf.map(member => {
                  if (!member.collective) return;
                  roles[member.collective.slug] = roles[member.collective.slug] || [];
                  roles[member.collective.slug].push(member.role);
                });
                LoggedInUser.roles = roles;

                /**
                 * CanEditExpense if LoggedInUser is:
                 * - author of the expense and expense.status === 'PENDING'
                 * - admin or host of expense.collective
                 * - admin or host of expense.collective.host
                 */
                LoggedInUser.canEditExpense = (expense) => {
                  if (expense.fromCollective && expense.fromCollective.id === LoggedInUser.collective.id && expense.status === 'PENDING') return true;
                  if (expense.collective) {
                    if (intersection(roles[expense.collective.slug], ['HOST', 'ADMIN']).length > 0) return true;
                    const hostSlug = get(expense, 'collective.host.slug');
                    if (intersection(roles[hostSlug], ['HOST', 'ADMIN']).length > 0) return true;
                  } 
                  return false;
                }

                /**
                 * CanPayExpense if LoggedInUser is HOST or ADMIN of the HOST of the collective
                 */
                LoggedInUser.canPayExpense = (expense) => {
                  const hostSlug = get(expense, 'collective.host.slug');
                  if (intersection(roles[hostSlug], ['HOST', 'ADMIN']).length > 0) return true;
                  return false;                  
                }
              }
              console.log(">>> LoggedInUser", LoggedInUser);
              return resolve(LoggedInUser);
            } catch (e) {
              console.error(">>> getLoggedInUser error:", e);
              return resolve(null);
            }
        });
      }
    })
  })(component);
}
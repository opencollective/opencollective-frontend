import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export const getLoggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id,
      username,
      firstName,
      lastName,
      avatar,
      collectives {
        id,
        slug,
        name,
        role
      }
    }
  }
`;

export const getCollectiveQuery = gql`
  query Collective($collectiveSlug: String!) {
    Collective(collectiveSlug: $collectiveSlug) {
      id,
      slug,
      name,
      description,
      backgroundImage,
      logo,
      currency
    }
  }
`;

const getEventQuery = gql`
  query Event($collectiveSlug: String!, $eventSlug: String!) {
    Event(collectiveSlug: $collectiveSlug, eventSlug: $eventSlug) {
      id,
      slug,
      createdByUser {
        id
      },
      name,
      description,
      startsAt,
      endsAt,
      timezone,
      location {
        name,
        address,
        lat,
        long
      },
      tiers {
        id,
        name,
        description,
        amount,
        currency,
        maxQuantity
      },
      collective {
        id,
        slug,
        name,
        mission,
        currency,
        backgroundImage,
        logo,
        stripePublishableKey
      },
      responses {
        createdAt,
        quantity,
        status,
        description,
        user {
          name,
          avatar,
          username,
          twitterHandle,
          description
        },
        tier {
          name
        }
      }
    }
  }
`;

const getEventsQuery = gql`
  query allEvents($collectiveSlug: String) {
    allEvents(collectiveSlug: $collectiveSlug) {
      id,
      slug,
      name,
      description,
      startsAt,
      endsAt,
      timezone,
      location {
        name,
        address,
        lat,
        long
      },
      tiers {
        id,
        name,
        description,
        amount
      },
      collective {
        id,
        slug,
        name,
        mission,
        backgroundImage,
        logo
      }
    }
  }
`;

const getAttendeesQuery = gql`
  query Event($collectiveSlug: String!, $eventSlug: String!) {
    Event(collectiveSlug: $collectiveSlug, eventSlug: $eventSlug) {
      slug,
      name,
      startsAt,
      locationName,
      responses {
        createdAt,
        quantity,
        status,
        description,
        user {
          id,
          firstName,
          lastName,
          avatar,
          username,
          twitterHandle,
          description
        },
        tier {
          name
        }
      }
    }
  }
`;

const getCollectiveTransactionsQuery = gql`
  query CollectiveTransactions($collectiveSlug: String!, $limit: Int, $offset: Int) {
    Collective(collectiveSlug: $collectiveSlug) {
      id,
      slug,
      name,
      currency,
      backgroundImage,
      settings,
      logo
    }
    allTransactions(collectiveSlug: $collectiveSlug, limit: $limit, offset: $offset) {
      id,
      uuid,
      title,
      createdAt,
      type,
      amount,
      currency,
      netAmountInGroupCurrency,
      hostFeeInTxnCurrency,
      platformFeeInTxnCurrency,
      paymentProcessorFeeInTxnCurrency,
      paymentMethod {
        name
      },
      user {
        id,
        name,
        avatar
      },
      host {
        id,
        name
      }
      ... on Expense {
        category
        attachment
      }
    }
  }
`;

const TRANSACTIONS_PER_PAGE = 10;
export const addCollectiveTransactionsData = graphql(getCollectiveTransactionsQuery, {
  options(props) {
    return {
      variables: {
        ...props,
        offset: 0,
        limit: TRANSACTIONS_PER_PAGE * 2
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allTransactions.length,
          limit: TRANSACTIONS_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allTransactions: [...previousResult.allTransactions, ...fetchMoreResult.allTransactions]
          })
        }
      })
    }
  })  
});
export const addCollectiveData = graphql(getCollectiveQuery);
export const addEventData = graphql(getEventQuery);
export const addEventsData = graphql(getEventsQuery);
export const addAttendeesData = graphql(getAttendeesQuery);

export const addGetLoggedInUserFunction = graphql(getLoggedInUserQuery, {
  props: ({ data }) => ({
    data,
    getLoggedInUser: (collectiveSlug) => {
      if (window.localStorage.getItem('accessToken')) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            return data.refetch().then(res => {
              if (res.data && res.data.LoggedInUser) {
                const LoggedInUser = {...res.data.LoggedInUser};
                if (LoggedInUser && LoggedInUser.collectives && collectiveSlug) {
                  const membership = LoggedInUser.collectives.find(c => c.slug === collectiveSlug);
                  LoggedInUser.membership = membership;
                }
                return resolve(LoggedInUser);
              }
            });      
          }, 0);
        });
      }
    }
  })
});
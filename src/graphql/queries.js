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

const getEventQuery = gql`
  query Event($collectiveSlug: String!, $eventSlug: String!) {
    Event(collectiveSlug: $collectiveSlug, eventSlug: $eventSlug) {
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
        amount,
        currency,
        maxQuantity
      },
      collective {
        id,
        slug,
        name,
        mission,
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
      location,
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

export const addEventData = graphql(getEventQuery);
export const addEventsData = graphql(getEventsQuery);
export const addAttendeesData = graphql(getAttendeesQuery);

export const addGetLoggedInUserFunction = graphql(getLoggedInUserQuery, {
  props: ({ data }) => ({
    data,
    getLoggedInUser: () => {
      return data.refetch();
    }
  })
});
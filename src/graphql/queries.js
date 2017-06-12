import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

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
      locationName,
      address,
      lat,
      long,
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

export const addEventData = graphql(getEventQuery);

const getEventsQuery = gql`
  query allEvents {
    allEvents {
      id,
      slug,
      name,
      description,
      startsAt,
      endsAt,
      timezone,
      locationName,
      address,
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

export const addEventsData = graphql(getEventsQuery);

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

export const addAttendeesData = graphql(getAttendeesQuery);
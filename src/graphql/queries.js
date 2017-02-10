import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const getEventQuery = gql`query Event($collectiveSlug: String!, $eventSlug: String!) {
  Event(collectiveSlug: $collectiveSlug, eventSlug: $eventSlug) {
    id,
    slug,
    name,
    description,
    location,
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
      quantity,
      status,
      user {
        name,
        avatar
      },
      tier {
        name
      }
    }
  }
}`;

export const addEventData = graphql(getEventQuery);
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const getEventQuery = gql`query Event {
  Event(collectiveSlug: "opencollective", eventSlug: "jan-meetup") {
    id,
    slug,
    name,
    description,
    location,
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
      logo
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
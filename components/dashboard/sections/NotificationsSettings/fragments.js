import { gql } from '../../../../lib/graphql/helpers';

export const accountActivitySubscriptionsFragment = gql`
  fragment AccountActivitySubscriptionsFields on Account {
    id
    name
    slug
    type
    imageUrl
    activitySubscriptions(channel: email) {
      id
      channel
      type
      active
    }
  }
`;

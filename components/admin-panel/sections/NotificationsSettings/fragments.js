import { gql } from '@apollo/client';

export const accountActivitySubscriptionsFragment = gql`
  fragment AccountActivitySubscriptionsFields on Account {
    id
    name
    slug
    type
    imageUrl(height: 96)
    activitySubscriptions(channel: email) {
      id
      channel
      type
      active
    }
  }
`;

import { gqlV2 } from '../../../../lib/graphql/helpers';

export const accountActivitySubscriptionsFragment = gqlV2/* GraphQL */ `
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

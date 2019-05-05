import { GraphQLEnumType } from 'graphql';

export const OrderFrequency = new GraphQLEnumType({
  name: 'OrderFrequency',
  values: {
    MONTHLY: {},
    YEARLY: {},
    ONETIME: {},
  },
});

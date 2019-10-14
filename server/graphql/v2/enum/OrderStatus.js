import { GraphQLEnumType } from 'graphql';

export const OrderStatus = new GraphQLEnumType({
  name: 'OrderStatus',
  description: 'All order statuses',
  values: {
    ACTIVE: {},
    CANCELLED: {},
    PENDING: {},
    PAID: {},
    ERROR: {},
    EXPIRED: {},
  },
});

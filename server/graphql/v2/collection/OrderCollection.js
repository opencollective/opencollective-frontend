import { GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

import { Order } from '../object/Order';

export const OrderCollection = new GraphQLObjectType({
  name: 'OrderCollection',
  description: 'A collection of "Orders"',
  fields: () => {
    return {
      offset: {
        type: GraphQLInt,
        resolve(result) {
          return result.offset;
        },
      },
      limit: {
        type: GraphQLInt,
        resolve(result) {
          return result.limit;
        },
      },
      totalCount: {
        type: GraphQLInt,
        resolve(result) {
          return result.count;
        },
      },
      nodes: {
        type: new GraphQLList(Order),
        resolve(result) {
          return result.rows;
        },
      },
    };
  },
});

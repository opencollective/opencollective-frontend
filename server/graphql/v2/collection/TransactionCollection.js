import { GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

import { Transaction } from '../interface/Transaction';

export const TransactionCollection = new GraphQLObjectType({
  name: 'TransactionCollection',
  description: 'This represents a collection of Transaction',
  fields: () => {
    return {
      totalCount: {
        type: GraphQLInt,
        resolve(result) {
          return result.count;
        },
      },
      nodes: {
        type: new GraphQLList(Transaction),
        resolve(result) {
          console.log(result.rows);
          return result.rows;
        },
      },
    };
  },
});

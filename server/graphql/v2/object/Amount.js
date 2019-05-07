import { GraphQLFloat, GraphQLObjectType } from 'graphql';

import { Currency } from '../enum/Currency';

export const Amount = new GraphQLObjectType({
  name: 'Amount',
  description: 'A financial amount.',
  fields: () => {
    return {
      value: {
        type: GraphQLFloat,
        resolve(amount) {
          return parseInt(amount.value, 10) / 100;
        },
      },
      currency: {
        type: Currency,
        resolve(amount) {
          return amount.currency;
        },
      },
    };
  },
});

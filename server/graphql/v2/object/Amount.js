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
          if (typeof amount.value === 'undefined') {
            return parseInt(amount, 10) / 100;
          } else {
            return parseInt(amount.value, 10) / 100;
          }
        },
      },
      currency: {
        type: Currency,
        resolve(amount) {
          if (typeof amount.currency === 'undefined') {
            return 'USD';
          } else {
            return amount.currency;
          }
        },
      },
    };
  },
});

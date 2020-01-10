import { GraphQLObjectType, GraphQLInt, GraphQLBoolean } from 'graphql';

import { Account, AccountFields } from '../interface/Account';
import { hostResolver } from '../../common/collective';

export const Collective = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents a Collective account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'COLLECTIVE',
  fields: () => {
    return {
      ...AccountFields,
      balance: {
        description: 'Amount of money in cents in the currency of the collective currently available to spend',
        type: GraphQLInt,
        resolve(collective, _, req) {
          return req.loaders.Collective.balance.load(collective.id);
        },
      },
      host: {
        description: 'Get the host collective that is receiving the money on behalf of this collective',
        type: Account,
        resolve: hostResolver,
      },
      isApproved: {
        description: 'Returns whether this collective is approved',
        type: GraphQLBoolean,
        resolve(collective) {
          return collective.isApproved();
        },
      },
    };
  },
});

import { GraphQLObjectType } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const Collective = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents an Collective account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'COLLECTIVE',
  fields: () => {
    return {
      ...AccountFields,
    };
  },
});

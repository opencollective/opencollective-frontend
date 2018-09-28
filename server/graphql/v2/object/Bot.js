import { GraphQLObjectType } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const Bot = new GraphQLObjectType({
  name: 'Bot',
  description: 'This represents a Bot account',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'BOT',
  fields: () => {
    return {
      ...AccountFields,
    };
  },
});

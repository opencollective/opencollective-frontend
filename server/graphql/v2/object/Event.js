import { GraphQLObjectType } from 'graphql';

import { Account, AccountFields } from '../interface/Account';

export const Event = new GraphQLObjectType({
  name: 'Event',
  description: 'This represents an Event',
  interfaces: () => [Account],
  isTypeOf: collective => collective.type === 'EVENT',
  fields: () => {
    return {
      ...AccountFields,
    };
  },
});

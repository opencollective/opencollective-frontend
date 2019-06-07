import { GraphQLEnumType } from 'graphql';

export const AccountOrdersFilter = new GraphQLEnumType({
  name: 'AccountOrdersFilter',
  description: 'Account orders filter (INCOMING or OUTGOING)',
  values: {
    INCOMING: {},
    OUTGOING: {},
  },
});

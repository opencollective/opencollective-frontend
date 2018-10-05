import { GraphQLEnumType } from 'graphql';

export const AccountType = new GraphQLEnumType({
  name: 'AccountType',
  description: 'All account types',
  values: {
    BOT: {},
    COLLECTIVE: {},
    EVENT: {},
    ORGANIZATION: {},
    USER: {},
  },
});

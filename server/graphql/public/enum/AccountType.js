import { GraphQLEnumType } from 'graphql';

export const AccountType = new GraphQLEnumType({
  name: 'AccountType',
  values: {
    COLLECTIVE: {},
    EVENT: {},
    ORGANIZATION: {},
    USER: {},
    BOT: {},
  },
});

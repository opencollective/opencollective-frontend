import { GraphQLEnumType } from 'graphql';

export const AccountType = new GraphQLEnumType({
  name: 'AccountType',
  description: 'All account types',
  values: {
    BOT: {},
    COLLECTIVE: {},
    EVENT: {},
    ORGANIZATION: {},
    INDIVIDUAL: {},
  },
});

export const AccountTypeToModelMapping = {
  BOT: 'BOT',
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  ORGANIZATION: 'ORGANIZATION',
  INDIVIDUAL: 'USER',
};

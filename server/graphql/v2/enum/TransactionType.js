import { GraphQLEnumType } from 'graphql';

export const TransactionType = new GraphQLEnumType({
  name: 'TransactionType',
  values: {
    DEBIT: {},
    CREDIT: {},
  },
});

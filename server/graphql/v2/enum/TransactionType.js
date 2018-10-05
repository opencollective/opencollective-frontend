import { GraphQLEnumType } from 'graphql';

export const TransactionType = new GraphQLEnumType({
  name: 'TransactionType',
  description: 'All transaction types',
  values: {
    DEBIT: {},
    CREDIT: {},
  },
});

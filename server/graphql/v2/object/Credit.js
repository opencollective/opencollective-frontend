import { GraphQLObjectType } from 'graphql';

import { Account } from '../interface/Account';
import { Transaction, TransactionFields } from '../interface/Transaction';

export const Credit = new GraphQLObjectType({
  name: 'Credit',
  description: 'This represents a Credit transaction',
  interfaces: () => [Transaction],
  isTypeOf: transaction => transaction.type === 'CREDIT',
  fields: () => {
    return {
      ...TransactionFields(),
      fromAccount: {
        type: Account,
        resolve(transaction) {
          return transaction.getFromCollective();
        },
      },
      toAccount: {
        type: Account,
        resolve(transaction) {
          return transaction.getCollective();
        },
      },
    };
  },
});

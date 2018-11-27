import {
  // GraphQLInt,
  GraphQLString,
  GraphQLInterfaceType,
} from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { idEncode } from '../identifiers';

import { Account } from './Account';

import { Amount } from '../object/Amount';

import { TransactionType } from '../enum/TransactionType';

export const Transaction = new GraphQLInterfaceType({
  name: 'Transaction',
  description: 'Transaction interface shared by all kind of transactions (Debit, Credit)',
  fields: () => {
    return {
      // _internal_id: {
      //   type: GraphQLInt,
      // },
      id: {
        type: GraphQLString,
      },
      type: {
        type: TransactionType,
      },
      description: {
        type: GraphQLString,
      },
      amount: {
        type: Amount,
      },
      netAmount: {
        type: Amount,
      },
      platformFee: {
        type: Amount,
      },
      hostFee: {
        type: Amount,
      },
      paymentProcessorFee: {
        type: Amount,
      },

      host: {
        type: Account,
      },
      fromAccount: {
        type: Account,
      },
      toAccount: {
        type: Account,
      },

      createdAt: {
        type: GraphQLDateTime,
      },
      updatedAt: {
        type: GraphQLDateTime,
      },
    };
  },
});

export const TransactionFields = () => {
  return {
    // _internal_id: {
    //   type: GraphQLInt,
    //   resolve(transaction) {
    //     return transaction.id;
    //   },
    // },
    id: {
      type: GraphQLString,
      resolve(transaction) {
        return idEncode(transaction.id, 'transaction');
      },
    },
    type: {
      type: TransactionType,
      resolve(transaction) {
        return transaction.type;
      },
    },
    description: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.description;
      },
    },
    amount: {
      type: Amount,
      resolve(transaction) {
        return { value: transaction.amount, currency: transaction.currency };
      },
    },
    netAmount: {
      type: Amount,
      resolve(transaction) {
        return {
          value: transaction.netAmountInCollectiveCurrency,
          currency: transaction.currency,
        };
      },
    },
    platformFee: {
      type: Amount,
      resolve(transaction) {
        return {
          value: transaction.platformFeeInHostCurrency || 0,
          currency: transaction.hostCurrency,
        };
      },
    },
    hostFee: {
      type: Amount,
      resolve(transaction) {
        return {
          value: transaction.hostFeeInHostCurrency || 0,
          currency: transaction.hostCurrency,
        };
      },
    },
    paymentProcessorFee: {
      type: Amount,
      resolve(transaction) {
        return {
          value: transaction.paymentProcessorFeeInHostCurrency || 0,
          currency: transaction.hostCurrency,
        };
      },
    },
    host: {
      type: Account,
      resolve(transaction) {
        return transaction.getHostCollective();
      },
    },
    createdAt: {
      type: GraphQLDateTime,
      resolve(transaction) {
        return transaction.createdAt;
      },
    },
    updatedAt: {
      type: GraphQLDateTime,
      resolve(transaction) {
        // Transactions are immutable right?
        return transaction.createdAt;
      },
    },
  };
};

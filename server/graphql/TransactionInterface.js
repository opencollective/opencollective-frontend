import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLObjectType
} from 'graphql';

import {
  CollectiveInterfaceType,
  UserCollectiveType
} from './CollectiveInterface';

import {
  SubscriptionType,
  OrderType,
  PaymentMethodType,
  UserType
} from './types';


export const TransactionInterfaceType = new GraphQLInterfaceType({
  name: "Transaction",
  description: "Transaction interface",
  resolveType: (transaction) => {
    switch (transaction.type) {
      case 'DONATION':
        return TransactionOrderType;
      case 'EXPENSE':
        return TransactionExpenseType;
      default:
        return null;
    }
  },
  fields: () => {
    return {
      id: { type: GraphQLInt },
      uuid: { type: GraphQLString },
      amount: { type: GraphQLInt },
      currency: { type: GraphQLString },
      netAmountInCollectiveCurrency: { type: GraphQLInt },
      hostFeeInTxnCurrency: { type: GraphQLInt },
      platformFeeInTxnCurrency: { type: GraphQLInt },
      paymentProcessorFeeInTxnCurrency: { type: GraphQLInt },
      createdByUser: { type: UserType },
      host: { type: UserCollectiveType },
      paymentMethod: { type: PaymentMethodType },
      fromCollective: { type: CollectiveInterfaceType },
      toCollective: { type: CollectiveInterfaceType },
      type: { type: GraphQLString },
      description: { type: GraphQLString },
      privateMessage: { type: GraphQLString },
      createdAt: { type: GraphQLString }
    }
  }
});

const TransactionFields = () => {
  return {
    id: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.id;
      }
    },
    uuid: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.uuid;
      }
    },
    type: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.type;
      }
    },
    amount: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.amount;
      }
    },
    currency: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.currency;
      }
    },
    txnCurrency: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.txnCurrency;
      }
    },
    txnCurrencyFxRate: {
      type: GraphQLFloat,
      resolve(transaction) {
        return transaction.txnCurrencyFxRate;
      }
    },
    hostFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.hostFeeInTxnCurrency;
      }
    },
    platformFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.platformFeeInTxnCurrency;
      }
    },
    paymentProcessorFeeInTxnCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.paymentProcessorFeeInTxnCurrency;
      }
    },
    netAmountInCollectiveCurrency: {
      type: GraphQLInt,
      resolve(transaction) {
        return transaction.netAmountInCollectiveCurrency;
      }
    },
    host: {
      type: UserCollectiveType,
      resolve(transaction) {
        return transaction.getHostCollective();
      }
    },
    createdByUser: {
      type: UserType,
      resolve(transaction) {
        return transaction.getCreatedByUser();
      }
    },
    fromCollective: {
      type: CollectiveInterfaceType,
      resolve(transaction) {
        return transaction.getFromCollective();
      }
    },
    toCollective: {
      type: CollectiveInterfaceType,
      resolve(transaction) {
        return transaction.getToCollective();
      }
    },
    createdAt: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.createdAt;
      }
    },
    paymentMethod: {
      type: PaymentMethodType,
      resolve(transaction) {
        return transaction.getPaymentMethod().then(pm => pm || { service: 'manual' });
      }
    }    
  }
}
export const TransactionExpenseType = new GraphQLObjectType({
  name: 'Expense',
  description: 'Expense model',
  interfaces: [ TransactionInterfaceType ],
  fields: () => {
    return {
      ... TransactionFields(),
      description: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.description || transaction.getExpense().then(expense => expense && expense.description);
        }
      },
      privateMessage: {
        type: GraphQLString,
        resolve(transaction, args, req) {
          return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.privateMessage);
        }
      },
      category: {
        type: GraphQLString,
        resolve(transaction, args, req) {
          return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.category);
        }
      },
      attachment: {
        type: GraphQLString,
        resolve(transaction, args, req) {
          return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.attachment);
        }
      }
    }
  }
});

export const TransactionOrderType = new GraphQLObjectType({
  name: 'Order',
  description: 'Order model',
  interfaces: [ TransactionInterfaceType ],
  fields: () => {
    return {
      ...TransactionFields(),
      description: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.description || transaction.getOrder().then(order => order && order.description);
        }
      },
      privateMessage: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.getOrder().then(order => order && order.privateMessage);
        }
      },
      order: {
        type: OrderType,
        resolve(transaction) {
          return transaction.getOrder();
        }
      },
      subscription: {
        type: SubscriptionType,
        resolve(transaction) {
          return transaction.getOrder()
            .then(order => order && order.getSubscription())
        }
      }
    }
  }
});

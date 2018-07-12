import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
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
      case 'CREDIT':
        return TransactionOrderType;
      case 'DEBIT':
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
      hostFeeInHostCurrency: { type: GraphQLInt },
      platformFeeInHostCurrency: { type: GraphQLInt },
      paymentProcessorFeeInHostCurrency: { type: GraphQLInt },
      createdByUser: { type: UserType },
      host: { type: CollectiveInterfaceType },
      paymentMethod: { type: PaymentMethodType },
      fromCollective: { type: CollectiveInterfaceType },
      collective: { type: CollectiveInterfaceType },
      type: { type: GraphQLString },
      description: { type: GraphQLString },
      privateMessage: { type: GraphQLString },
      createdAt: { type: GraphQLString },
      updatedAt: { type: GraphQLString },
      refundTransaction: { type: TransactionInterfaceType }
    };
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
    refundTransaction: {
      type: TransactionInterfaceType,
      resolve(transaction) {
        return transaction.getRefundTransaction();
      }
    },
    uuid: {
      type: GraphQLString,
      resolve(transaction, args, req) {
        if (!req.remoteUser) {
          return null;
        }
        return transaction.getDetailsForUser(req.remoteUser);
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
    hostCurrency: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.hostCurrency;
      }
    },
    hostCurrencyFxRate: {
      type: GraphQLFloat,
      description: "Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency)",
      resolve(transaction) {
        return transaction.hostCurrencyFxRate;
      }
    },
    hostFeeInHostCurrency: {
      type: GraphQLInt,
      description: "Fee kept by the host in the lowest unit of the currency of the host (ie. in cents)",
      resolve(transaction) {
        return transaction.hostFeeInHostCurrency;
      }
    },
    platformFeeInHostCurrency: {
      type: GraphQLInt,
      description: "Fee kept by the Open Collective Platform in the lowest unit of the currency of the host (ie. in cents)",
      resolve(transaction) {
        return transaction.platformFeeInHostCurrency;
      }
    },
    paymentProcessorFeeInHostCurrency: {
      type: GraphQLInt,
      description: "Fee kept by the payment processor in the lowest unit of the currency of the host (ie. in cents)",
      resolve(transaction) {
        return transaction.paymentProcessorFeeInHostCurrency;
      }
    },
    netAmountInCollectiveCurrency: {
      type: GraphQLInt,
      description: "Amount after fees received by the collective in the lowest unit of its own currency (typically cents)",
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
    collective: {
      type: CollectiveInterfaceType,
      resolve(transaction) {
        return transaction.getCollective();
      }
    },
    createdAt: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.createdAt;
      }
    },
    updatedAt: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.updatedAt;
      }
    },
    paymentMethod: {
      type: PaymentMethodType,
      resolve(transaction, args, req) {
        if (!transaction.PaymentMethodId) return null;
        // TODO: put behind a login check
        return req.loaders.paymentMethods.findById.load(transaction.PaymentMethodId);
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
          // TODO: Put behind a login check
          return transaction.getOrder().then(order => order && order.privateMessage);
        }
      },
      publicMessage: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.getOrder().then(order => order && order.publicMessage);
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

export const TransactionType = new GraphQLEnumType({
  name: 'TransactionType',
  description: 'Type of transaction in the ledger',
  values: {
    CREDIT: {},
    DEBIT: {},
  },
});

export const OrderDirectionType = new GraphQLEnumType({
  name: 'OrderDirection',
  description: 'Possible directions in which to order a list of items when provided an orderBy argument.',
  values: {
    ASC: {},
    DESC: {},
  },
});

export const TransactionOrder = new GraphQLInputObjectType({
  name: 'TransactionOrder',
  description: 'Ordering options for transactions',
  fields: {
    field: {
      description: 'The field to order transactions by.',
      defaultValue: 'createdAt',
      type: new GraphQLEnumType({
        name: 'TransactionOrderField',
        description: 'Properties by which transactions can be ordered.',
        values: {
          CREATED_AT: {
            value: 'createdAt',
            description: 'Order transactions by creation time.',
          },
        },
      }),
    },
    direction: {
      description: 'The ordering direction.',
      defaultValue: 'DESC',
      type: OrderDirectionType,
    },
  },
});

TransactionOrder.defaultValue = Object.entries(TransactionOrder.getFields()).reduce((values, [key, value]) => ({
  ...values,
  [key]: value.defaultValue,
}), {});

export const PaginatedTransactionsType = new GraphQLObjectType({
  name: 'PaginatedTransactions',
  description: 'List of transactions with pagination data',
  fields: () => ({
    transactions: { type: new GraphQLList(TransactionInterfaceType) },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
    total: { type: GraphQLInt },
  }),
});

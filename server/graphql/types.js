import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInterfaceType
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';

import models from '../models';
import dataloaderSequelize from 'dataloader-sequelize';
dataloaderSequelize(models.Order);
dataloaderSequelize(models.Transaction);
dataloaderSequelize(models.Expense);

// This breaks the tests for some reason (mocha test/Member.routes.test.js -g "successfully add a user to a collective with a role")
// dataloaderSequelize(models.User);

export const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'This represents a User',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(user) {
          return user.id;
        }
      },
      firstName: {
        type: GraphQLString,
        resolve(user) {
          return user.firstName;
        }
      },
      lastName: {
        type: GraphQLString,
        resolve(user) {
          return user.lastName;
        }
      },
      name: {
        type: GraphQLString,
        resolve(user) {
          return user.name;
        }
      },
      image: {
        type: GraphQLString,
        resolve(user) {
          return user.image;
        }
      },
      username: {
        type: GraphQLString,
        resolve(user) {
          return user.username;
        }
      },
      email: {
        type: GraphQLString,
        resolve(user) {
          return user.email;
        }
      },
      description: {
        type: GraphQLString,
        resolve(user) {
          return user.description
        }
      },
      organization: {
        type: GraphQLString,
        resolve(user) {
          return user.organization
        }
      },
      isOrganization: {
        type: GraphQLBoolean,
        resolve(user) {
          return user.isOrganization;
        }
      },
      twitterHandle: {
        type: GraphQLString,
        resolve(user) {
          return user.twitterHandle;
        }
      },
      billingAddress: {
        type: GraphQLString,
        resolve(user) {
          return user.billingAddress;
        }
      },
      website: {
        type: GraphQLString,
        resolve(user) {
          return user.website;
        }
      },
      paypalEmail: {
        type: GraphQLString,
        resolve(user) {
          return user.paypalEmail;
        }
      },
      collectives: {
        type: new GraphQLList(CollectiveType),
        resolve(user) {
          return user.getCollectivesWithRoles();
        }
      },
      paymentMethods: {
        type: new GraphQLList(PaymentMethodType),
        resolve(user, args, req) {
          if (!req.remoteUser || req.remoteUser.id !== user.id) return [];
          return models.PaymentMethod.findAll({where: { UserId: user.id, identifier: { $ne: null }, confirmedAt: { $ne: null } }});
        }
      }
    }
  }
});

export const CollectiveType = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents a Collective',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.id;
        }
      },
      createdByUser: {
        type: UserType,
        resolve(collective) {
          return models.User.findById(collective.CreatedByUserId)
        }
      },
      parentCollective: {
        type: CollectiveType,
        resolve(collective) {
          return models.Collective.findById(collective.ParentCollectiveId);
        }
      },
      name: {
        type: GraphQLString,
        resolve(collective) {
          return collective.name;
        }
      },
      description: {
        type: GraphQLString,
        resolve(collective) {
          return collective.description;
        }
      },
      longDescription: {
        type: GraphQLString,
        resolve(collective) {
          return collective.longDescription;
        }
      },
      mission: {
        type: GraphQLString,
        resolve(collective) {
          return collective.mission;
        }
      },
      location: {
        type: LocationType,
        description: 'Name, address, lat, long of the location.',
        resolve(collective) {
          return collective.location;
        }
      },
      startsAt: {
        type: GraphQLString,
        resolve(collective) {
          return collective.startsAt
        }
      },
      endsAt: {
        type: GraphQLString,
        resolve(collective) {
          return collective.endsAt
        }
      },
      timezone: {
        type: GraphQLString,
        resolve(collective) {
          return collective.timezone
        }
      },
      maxAmount: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.maxAmount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(collective) {
          return collective.currency;
        }
      },
      image: {
        type: GraphQLString,
        resolve(collective) {
          return collective.image;
        }
      },
      backgroundImage: {
        type: GraphQLString,
        resolve(collective) {
          return collective.backgroundImage;
        }
      },
      settings: {
        type: GraphQLJSON,
        resolve(collective) {
          return collective.settings || {};
        }
      },
      slug: {
        type: GraphQLString,
        resolve(collective) {
          return collective.slug;
        }
      },
      users: {
        type: new GraphQLList(UserType),
        resolve(collective, args, req) {
          return collective.getUsersForViewer(req.remoteUser);
        }
      },
      maxQuantity: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.maxQuantity;
        }
      },
      tiers: {
        type: new GraphQLList(TierType),
        resolve(collective) {
          return collective.getTiers({ order: [['name', 'ASC']] });
        }
      },
      orders: {
        type: new GraphQLList(OrderType),
        resolve(collective) {
          return collective.getOrders({
            where: { processedAt: { $ne: null } },
            order: [ ['createdAt', 'DESC'] ]
          });
        }
      },
      transactions: {
        type: new GraphQLList(TransactionInterfaceType),
        args: {
          type: { type: GraphQLString },
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(collective, args) {
          const query = {};
          if (args.type) query.where = { type: args.type };
          if (args.limit) query.limit = args.limit;
          if (args.offset) query.offset = args.offset;
          query.order = [ ['id', 'DESC'] ];
          return collective.getTransactions(query);
        }
      },
      role: {
        type: GraphQLString,
        resolve(collective, args, req) {
          return collective.role || collective.getRoleForUser(req.remoteUser);
        }
      },
      twitterHandle: {
        type: GraphQLString,
        resolve(collective) {
          return collective.twitterHandle;
        }
      },
      events: {
        type: new GraphQLList(CollectiveType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(collective, args) {
          const query = { type: 'EVENT', ParentCollectiveId: collective.id };
          if (args.limit) query.limit = args.limit;
          if (args.offset) query.offset = args.offset;
          return models.Collective.findAll(query);
        }
      },
      stripePublishableKey: {
        type: GraphQLString,
        resolve(collective) {
          return collective.getStripeAccount()
          .then(stripeAccount => stripeAccount && stripeAccount.stripePublishableKey)
        }
      }
    }
  }
});

export const LocationType = new GraphQLObjectType({
  name: 'LocationType',
  description: 'Type for Location',
  fields: () => ({
    name: { type: GraphQLString },
    address: { type: GraphQLString },
    lat: { type: GraphQLFloat },
    long: { type: GraphQLFloat }
  })
});

export const TierType = new GraphQLObjectType({
  name: 'Tier',
  description: 'This represents an Tier',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.id;
        }
      },
      slug: {
        type: GraphQLString,
        resolve(tier) {
          return tier.slug
        }
      },
      type: {
        type: GraphQLString,
        resolve(tier) {
          return tier.type
        }
      },
      name: {
        type: GraphQLString,
        resolve(tier) {
          return tier.name
        }
      },
      description: {
        type: GraphQLString,
        resolve(tier) {
          return tier.description
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(tier) {
          return tier.currency;
        }
      },
      interval: {
        type: GraphQLString,
        resolve(tier) {
          return tier.interval;
        }
      },
      maxQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.maxQuantity;
        }
      },
      maxQuantityPerUser: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.maxQuantityPerUser;
        }
      },
      availableQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.availableQuantity()
          // graphql doesn't like infinity value
          .then(availableQuantity => availableQuantity === Infinity ? 10000000 : availableQuantity);
        }
      },
      goal: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.goal;
        }
      },
      totalAmount: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.totalAmount();
        }
      },
      password: {
        type: GraphQLString,
        resolve(tier) {
          return tier.password
        }
      },
      startsAt: {
        type: GraphQLString,
        resolve(tier) {
          return tier.startsAt
        }
      },
      endsAt: {
        type: GraphQLString,
        resolve(tier) {
          return tier.startsAt
        }
      },
      collective: {
        type: CollectiveType,
        resolve(tier) {
          return tier.getCollective();
        }
      },
      event: {
        type: CollectiveType,
        resolve(tier) {
          return tier.getCollective();
        }
      },
      orders: {
        type: new GraphQLList(OrderType),
        resolve(tier) {
          return tier.getOrders({ where: { processedAt: { $ne: null } } });
        }
      }
    }
  }
});

export const MemberType = new GraphQLObjectType({
  name: 'Member',
  description: 'This is a Member',
  fields: () => {
    return {
       id: {
        type: GraphQLInt,
        resolve(order) {
          return order.id;
        }
      },
      collective: {
        type: CollectiveType,
        resolve(member) {
          return member.getCollective();
        }
      },
      user: {
        type: UserType,
        resolve(member, args, req) {
          return member.getUserForViewer(req.remoteUser);
        }
      },
      role: {
        type: GraphQLString,
        resolve(member) {
          return member.role;
        }
      },
      tier: {
        type: TierType,
        resolve(member) {
          return member.getTier();
        }
      }
    }
  }
});

export const OrderType = new GraphQLObjectType({
  name: 'OrderType',
  description: 'This is an order',
  fields: () => {
    return {
       id: {
        type: GraphQLInt,
        resolve(order) {
          return order.id;
        }
      },
      quantity: {
        type: GraphQLInt,
        resolve(order) {
          return order.quantity;
        }
      },
      user: {
        type: UserType,
        resolve(order, args, req) {
          return order.getUserForViewer(req.remoteUser);
        }
      },
      description: {
        type: GraphQLString,
        resolve(order) {
          return order.description;
        }
      },
      collective: {
        type: CollectiveType,
        resolve(order) {
          return order.getCollective();
        }
      },
      tier: {
        type: TierType,
        resolve(order) {
          return order.getTier();
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(order) {
          return order.createdAt;
        }
      },
      processedAt: {
        type: GraphQLString,
        resolve(order) {
          return order.processedAt;
        }
      }
    }
  }
});

export const PaymentMethodType = new GraphQLObjectType({
  name: "PaymentMethodType",
  description: "Sanitized PaymentMethod Info (PaymentMethod model)",
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.id;
        }
      },
      uuid: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.uuid;
        }
      },
      service: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.service;
        }
      },
      brand: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.brand;
        }
      },
      funding: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.funding;
        }
      },
      country: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.country;
        }
      },
      identifier: { // last 4 digit of card number for Stripe
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.identifier;
        }
      },
      fullName: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.fullName;
        }
      },
      expMonth: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.expMonth;
        }
      },
      expYear: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.expYear;
        }
      }
    }
  }
});

export const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  description: "Subscription model",
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(s) {
          return s.id;
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(s) {
          return s.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(s) {
          return s.currency;
        }
      },
      interval: {
        type: GraphQLString,
        resolve(s) {
          return s.interval;
        }
      },
      isActive: {
        type: GraphQLBoolean,
        resolve(s) {
          return s.isActive;
        }
      }
    }
  }
});

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
  fields: {
    id: { type: GraphQLInt },
    uuid: { type: GraphQLString },
    amount: { type: GraphQLInt },
    currency: { type: GraphQLString },
    netAmountInCollectiveCurrency: { type: GraphQLInt },
    hostFeeInTxnCurrency: { type: GraphQLInt },
    platformFeeInTxnCurrency: { type: GraphQLInt },
    paymentProcessorFeeInTxnCurrency: { type: GraphQLInt },
    user: { type: UserType },
    host: { type: UserType },
    paymentMethod: { type: PaymentMethodType },
    collective: { type: CollectiveType },
    type: { type: GraphQLString },
    description: { type: GraphQLString },
    privateNotes: { type: GraphQLString },
    createdAt: { type: GraphQLString }
  }
});

export const TransactionExpenseType = new GraphQLObjectType({
  name: 'Expense',
  description: 'Expense model',
  interfaces: [TransactionInterfaceType],
  fields: {
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
      type: UserType,
      resolve(transaction, args, req) {
        return transaction.getHostForViewer(req.remoteUser);
      }
    },
    user: {
      type: UserType,
      resolve(transaction, args, req) {
        return transaction.getUserForViewer(req.remoteUser);
      }
    },
    description: {
      type: GraphQLString,
      resolve(transaction) {
        return transaction.description || transaction.getExpense().then(expense => expense && expense.description);
      }
    },
    collective: {
      type: CollectiveType,
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
    privateNotes: {
      type: GraphQLString,
      resolve(transaction, args, req) {
        return transaction.getExpenseForViewer(req.remoteUser).then(expense => expense && expense.privateNotes);
      }
    },
    paymentMethod: {
      type: PaymentMethodType,
      resolve(transaction) {
        return transaction.getPaymentMethod().then(pm => pm || { service: 'manual' });
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
});

export const TransactionOrderType = new GraphQLObjectType({
  name: 'Order',
  description: 'Order model',
  interfaces: [TransactionInterfaceType],
  fields: () => {
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
        type: UserType,
        resolve(transaction, args, req) {
          return transaction.getHostForViewer(req.remoteUser);
        }
      },
      user: {
        type: UserType,
        resolve(transaction, args, req) {
          return transaction.getUserForViewer(req.remoteUser);
        }
      },
      description: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.description || transaction.getOrder().then(order => order && order.description);
        }
      },
      collective: {
        type: CollectiveType,
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
      privateNotes: {
        type: GraphQLString,
        resolve(transaction) {
          return transaction.getOrder().then(order => order && order.privateNotes);
        }
      },
      paymentMethod: {
        type: PaymentMethodType,
        resolve(transaction) {
          return transaction.getPaymentMethod().then(pm => pm || { service: 'manual' });
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
          return transaction.getOrder().then(order => order && order.getSubscription());
        }
      }
    }
  }
});

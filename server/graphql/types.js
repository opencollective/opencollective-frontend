import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';

import {
  CollectiveInterfaceType
} from './CollectiveInterface';

import {
  TransactionInterfaceType
} from './TransactionInterface';

import models from '../models';
import dataloaderSequelize from 'dataloader-sequelize';
import { pick } from 'lodash';

dataloaderSequelize(models.Order);
dataloaderSequelize(models.Transaction);
dataloaderSequelize(models.Collective);
dataloaderSequelize(models.Expense);

// This breaks the tests for some reason (mocha test/Member.routes.test.js -g "successfully add a user to a collective with a role")
// dataloaderSequelize(models.User);

export const UserType = new GraphQLObjectType({
  name: 'UserDetails',
  description: 'This represents the details of a User',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(user) {
          return user.id;
        }
      },
      CollectiveId: {
        type: GraphQLInt,
        resolve(user) {
          return user.CollectiveId;
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(user, args, req) {
          return req.loaders.collective.findById.load(user.CollectiveId);
        }
      },
      username: {
        type: GraphQLString,
        resolve(user) {
          return user.username;
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
      email: {
        type: GraphQLString,
        resolve(user, args, req) {
          return user.getPersonalDetails(req.remoteUser).then(user => user.email);
        }
      },
      memberOf: {
        type: new GraphQLList(MemberType),
        resolve(user) {
          return models.Member.findAll({
            where: { MemberCollectiveId: user.CollectiveId },
            include: [ { model: models.Collective, as: 'collective', required: true } ]
          });
        }
      },
      billingAddress: {
        type: GraphQLString,
        resolve(user) {
          return user.billingAddress;
        }
      },
      paypalEmail: {
        type: GraphQLString,
        resolve(user) {
          return user.paypalEmail;
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
      createdAt: {
        type: GraphQLString,
        resolve(member) {
          return member.createdAt;
        }
      },
      totalDonations: {
        type: GraphQLInt,
        resolve(member, args, req) {
          return member.totalDonations || req.loaders.transactions.totalAmountDonatedFromTo.load({
            FromCollectiveId: member.MemberCollectiveId,
            CollectiveId: member.CollectiveId,
          });
        }
      },
      orders: {
        type: new GraphQLList(OrderType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(member, args, req) {
          return req.loaders.orders.findByMembership(args).load(`${member.CollectiveId}:${member.MemberCollectiveId}`);
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(member, args, req) {
          return member.collective || req.loaders.collective.findById.load(member.CollectiveId);
        }
      },
      member: {
        type: CollectiveInterfaceType,
        resolve(member, args, req) {
          return member.memberCollective || req.loaders.collective.findById.load(member.MemberCollectiveId);
        }
      },
      role: {
        type: GraphQLString,
        resolve(member) {
          return member.role;
        }
      },
      description: {
        type: GraphQLString,
        resolve(member) {
          return member.description;
        }
      },
      tier: {
        type: TierType,
        resolve(member, args, req) {
          return member.TierId && req.loaders.tiers.findById.load(member.TierId);
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

export const ExpenseType = new GraphQLObjectType({
  name: 'ExpenseType',
  description: 'This represents an Expense',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(expense) {
          return expense.id;
        }
      },
      amount: {
        type: GraphQLInt,
        resolve(expense) {
          return expense.amount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(expense) {
          return expense.currency;
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(expense) {
          return expense.createdAt;
        }
      },
      description: {
        type: GraphQLString,
        resolve(expense) {
          return expense.description;
        }
      },
      category: {
        type: GraphQLString,
        resolve(expense) {
          return expense.category;
        }
      },
      status: {
        type: GraphQLString,
        resolve(expense) {
          return expense.status;
        }
      },
      payoutMethod: {
        type: GraphQLString,
        resolve(expense) {
          return expense.payoutMethod;
        }
      },
      privateMessage: {
        type: GraphQLString,
        resolve(expense, args, req) {
          if (!req.remoteUser) return null;
          if (req.remoteUser.isAdmin(expense.CollectiveId) || req.remoteUser.id === expense.UserId) {
            return expense.privateMessage;
          }
        }
      },
      attachment: {
        type: GraphQLString,
        resolve(expense, args, req) {
          if (!req.remoteUser) return null;
          if (req.remoteUser.isAdmin(expense.CollectiveId) || req.remoteUser.id === expense.UserId) {
            return expense.attachment;
          }
        }
      },
      user: {
        type: UserType,
        resolve(expense) {
          return expense.getUser();
        }
      },
      fromCollective: {
        type: CollectiveInterfaceType,
        resolve(expense) {
          return expense.getUser().then(u => models.Collective.findById(u.CollectiveId));
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(expense) {
          return expense.getCollective();
        }
      },
      transaction: {
        type: CollectiveInterfaceType,
        resolve(expense) {
          return models.Transaction.findOne({
            where: {
              CollectiveId: expense.CollectiveId,
              ExpenseId: expense.id
            }
          });
        }
      }
    }
  }
});

export const TierStatsType = new GraphQLObjectType({
  name: 'TierStatsType',
  description: 'Stats about a tier',
  fields: () => {
    return {
      // We always have to return an id for apollo's caching
      id: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.id;
        }
      },
      totalOrders: {
        description: 'total number of individual orders',
        type: GraphQLInt,
        resolve(tier, args, req) {
          return req.loaders.tiers.totalOrders.load(tier.id);
        }
      },
      totalDistinctOrders: {
        description: 'total number of people/organizations in this tier',
        type: GraphQLInt,
        resolve(tier, args, req) {
          return req.loaders.tiers.totalDistinctOrders.load(tier.id);
        }
      },
      availableQuantity: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.availableQuantity()
          // graphql doesn't like infinity value
          .then(availableQuantity => availableQuantity === Infinity ? 10000000 : availableQuantity);
        }
      }
    }
  }
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
      button: {
        type: GraphQLString,
        resolve(tier) {
          return tier.button
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
      presets: {
        type: new GraphQLList(GraphQLString),
        resolve(tier) {
          return tier.presets;
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
      goal: {
        type: GraphQLInt,
        resolve(tier) {
          return tier.goal;
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
        type: CollectiveInterfaceType,
        resolve(tier, args, req) {
          return req.loaders.collective.findById.load(tier.CollectiveId);
        }
      },
      event: {
        type: CollectiveInterfaceType,
        resolve(tier, args, req) {
          return req.loaders.collective.findById.load(tier.CollectiveId);
        }
      },
      orders: {
        type: new GraphQLList(OrderType),
        args: {
          limit: { type: GraphQLInt }
        },
        resolve(tier, args) {
          return tier.getOrders({
            where: { processedAt: { $ne: null } },
            limit: args.limit
          });
        }
      },
      stats: {
        type: TierStatsType,
        resolve(tier) {
          return tier;
        }
      }
    }
  }
});

export const StatsOrderType = new GraphQLObjectType({
  name: 'StatsOrderType',
  description: 'Stats about an order',
  fields: () => {
    return {
      // We always have to return an id for apollo's caching (key: __typename+id)
      id: {
        type: GraphQLInt,
        resolve(order) {
          return order.id;
        }
      },
      totalTransactions: {
        description: 'total of all the transactions for this order (includes past recurring transactions)',
        type: GraphQLInt,
        resolve(order, args, req) {
          return req.loaders.transactions.totalAmountForOrderId.load(order.id);
        }
      }
    }
  }
});

export const OrderType = new GraphQLObjectType({
  name: 'OrderType',
  description: 'This is an order (for donations, buying tickets, subscribing to a Tier)',
  fields: () => {
    return {
       id: {
        type: GraphQLInt,
        resolve(order) {
          return order.id;
        }
      },
      quantity: {
        description: 'quantity of items (defined by Tier)',
        type: GraphQLInt,
        resolve(order) {
          return order.quantity;
        }
      },
      totalAmount: {
        description: `total amount for this order (doesn't include recurring transactions)`,
        type: GraphQLInt,
        resolve(order) {
          return order.totalAmount;
        }
      },
      interval: {
        description: `frequency of the subscription if any (could be either null, 'month' or 'year')`,
        type: GraphQLString,
        resolve(order) {
          return order.getSubscription(s => s.interval);
        }
      },
      subscription: {
        type: SubscriptionType,
        resolve(order) {
          return order.getSubscription();
        }
      },
      stats: {
        type: StatsOrderType,
        resolve(order) {
          return order;
        }
      },
      createdByUser: {
        type: UserType,
        resolve(order) {
          return order.getCreatedByUser();
        }
      },
      description: {
        description: 'Description of the order that will show up in the invoice',
        type: GraphQLString,
        resolve(order) {
          return order.description;
        }
      },
      publicMessage: {
        description: 'Custom user message to show with the order, e.g. a special dedication, "in memory of", or to add a custom one liner when RSVP for an event',
        type: GraphQLString,
        resolve(order) {
          return order.publicMessage;
        }
      },
      privateMessage: {
        description: 'Private message for the admins and the host of the collective',
        type: GraphQLString,
        resolve(order) {
          return order.privateMessage;
        }
      },
      fromCollective: {
        description: 'Collective ordering (most of the time it will be the collective of the createdByUser)',
        type: CollectiveInterfaceType,
        resolve(order) {
          return order.getFromCollective();
        }
      },
      collective: {
        description: 'Collective that receives the order',
        type: CollectiveInterfaceType,
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
      paymentMethod: {
        description: 'Payment method used to pay for the order. The paymentMethod is also attached to individual transactions since a credit card can change over the lifetime of a subscription.',
        type: PaymentMethodType,
        resolve(order) {
          return order.getPaymentMethod();
        }
      },
      transactions: {
        description: 'transactions for this order ordered by createdAt DESC',
        type: new GraphQLList(TransactionInterfaceType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          type: {
            type: GraphQLString,
            description: "type of transaction (DEBIT/CREDIT)"
          }
        },
        resolve(order, args, req) {
          const query = {
            where: {},
            limit: args.limit || 10,
            offset: args.offset || 0
          };
          if (args.type) query.where.type = args.type;
          return req.loaders.transactions.findByOrderId(query).load(order.id);
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(order) {
          return order.createdAt;
        }
      },
      processedAt: {
        description: 'Date and time when the order has been processed by the payment processor if needed to be (if totalAmount > 0)',
        type: GraphQLString,
        resolve(order) {
          return order.processedAt;
        }
      }
    }
  }
});

export const ConnectedAccountType = new GraphQLObjectType({
  name: "ConnectedAccountType",
  description: "Sanitized ConnectedAccount Info (ConnectedAccount model)",
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(ca) {
          return ca.id;
        }
      },
      service: {
        type: GraphQLString,
        resolve(ca) {
          return ca.service;
        }
      },
      username: {
        type: GraphQLString,
        resolve(ca) {
          return ca.username;
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(ca) {
          return ca.createdAt;
        }
      },
      updatedAt: {
        type: GraphQLString,
        resolve(ca) {
          return ca.updatedAt;
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
      data: {
        type: GraphQLJSON,
        resolve(paymentMethod) {
          return paymentMethod.data;
        }
      },
      name: { // last 4 digit of card number for Stripe
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.name;
        }
      },
      primary: {
        type: GraphQLBoolean,
        resolve(paymentMethod) {
          return paymentMethod.primary;
        }
      },
      monthlyLimitPerMember: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.monthlyLimitPerMember;
        }
      },
      balance: {
        type: GraphQLInt,
        resolve(paymentMethod, args, req) {
          return paymentMethod.getBalanceForUser(req.remoteUser).then(balance => balance.amount);
        }
      },
      currency: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.currency;
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
      stripeSubscriptionId: {
        type: GraphQLString,
        resolve(s) {
          return s.stripeSubscriptionId;
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

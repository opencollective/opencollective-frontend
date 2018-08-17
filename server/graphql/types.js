import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';
import he from 'he';

import {
  CollectiveInterfaceType,
  CollectiveSearchResultsType
} from './CollectiveInterface';

import {
  TransactionInterfaceType,
  OrderDirectionType,
} from './TransactionInterface';

import {
  ApplicationType,
} from './Application';

import models, { Op, sequelize } from '../models';
import dataloaderSequelize from 'dataloader-sequelize';
import { strip_tags } from '../lib/utils';
import status from '../constants/expense_status';

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
          if (!user.CollectiveId) {
            return console.error(">>> user", user.id, "does not have a CollectiveId", user.CollectiveId);
          }
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
          return user.billingAddress; // TODO: shouldn't this be behind a login check like email and paypalEmail?
        }
      },
      paypalEmail: {
        type: GraphQLString,
        resolve(user, args, req) {
          return user.getPersonalDetails(req.remoteUser).then(user => user.paypalEmail);
        }
      },
      applications: {
        type: new GraphQLList(ApplicationType),
        resolve(user) {
          return models.Application.findAll({
            where: { CreatedByUserId: user.id },
          });
        }
      },
    }
  }
});


export const StatsMemberType = new GraphQLObjectType({
  name: 'StatsMemberType',
  description: 'Stats about a membership',
  fields: () => {
    return {
      // We always have to return an id for apollo's caching (key: __typename+id)
      id: {
        type: GraphQLInt,
        resolve(member) {
          return member.id;
        }
      },
      totalDonations: {
        type: GraphQLInt,
        description: "total amount donated by this member",
        resolve(member, args, req) {
          return member.totalDonations || req.loaders.transactions.totalAmountDonatedFromTo.load({
            FromCollectiveId: member.MemberCollectiveId,
            CollectiveId: member.CollectiveId,
          });
        }
      },
      totalRaised: {
        type: GraphQLInt,
        description: "total amount raised by this member",
        resolve(member, args, req) {
          return member.totalRaised || req.loaders.members.totalAmountRaised.load({
            ReferralCollectiveId: member.MemberCollectiveId,
            CollectiveId: member.CollectiveId,
          });
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
      orders: {
        type: new GraphQLList(OrderType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(member, args, req) {
          return req.loaders.orders.findByMembership.load(`${member.CollectiveId}:${member.MemberCollectiveId}`)
            .then(orders => {
              const { limit, offset } = args;
              if (limit) {
                return orders.splice(offset || 0, limit);
              } else {
                return orders;
              }
            });
      }
      },
      transactions: {
        type: new GraphQLList(TransactionInterfaceType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(member, args, req) {
          return req.loaders.members.transactions.load(`${member.CollectiveId}:${member.MemberCollectiveId}`)
            .then(transactions => {
              /**
               * xdamman: note: we can't pass a limit to the loader
               * because the limit would be applied to the entire result set
               * that includes the transactions from other members
               * Given that the number of transaction for a given member to a given collective
               * is expected to always be < 100, the tradeoff is in favor of using the DataLoader
               */
              const { limit, offset } = args;
              if (limit) {
                return transactions.splice(offset || 0, limit);
              } else {
                return transactions;
              }
            });
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
      },
      stats: {
        type: StatsMemberType,
        resolve(member) {
          return member;
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

export const InvoiceType = new GraphQLObjectType({
  name: 'InvoiceType',
  description: 'This represents an Invoice',
  fields: () => {
    return {
      slug: {
        type: GraphQLString,
        resolve(invoice) {
          return invoice.slug;
        }
      },
      title: {
        type: GraphQLString,
        description: "Title for the invoice. Depending on the type of legal entity, a host should issue an Invoice or a Receipt.",
        resolve(invoice) {
          return invoice.title || "Donation Receipt";
        }
      },
      year: {
        type: GraphQLInt,
        resolve(invoice) {
          return invoice.year;
        }
      },
      month: {
        type: GraphQLInt,
        resolve(invoice) {
          return invoice.month;
        }
      },
      totalAmount: {
        type: GraphQLInt,
        resolve(invoice) {
          return invoice.totalAmount;
        }
      },
      currency: {
        type: GraphQLString,
        resolve(invoice) {
          return invoice.currency;
        }
      },
      host: {
        type: CollectiveInterfaceType,
        resolve(invoice, args, req) {
          return req.loaders.collective.findById.load(invoice.HostCollectiveId);
        }
      },
      fromCollective: {
        type: CollectiveInterfaceType,
        resolve(invoice, args, req) {
          return req.loaders.collective.findById.load(invoice.FromCollectiveId);
        }
      },
      transactions: {
        type: new GraphQLList(TransactionInterfaceType),
        async resolve(invoice) {
          const startsAt = new Date(`${invoice.year}-${invoice.month}-01`);
          const endsAt = new Date(startsAt);
          endsAt.setMonth(startsAt.getMonth() + 1);
          const where = {
            FromCollectiveId: invoice.FromCollectiveId,
            type: 'CREDIT',
            createdAt: { [Op.gte]: startsAt, [Op.lt]: endsAt }
          };
          if (invoice.HostCollectiveId) {
            where.HostCollectiveId = invoice.HostCollectiveId;
          }
          const transactions = await models.Transaction.findAll({ where });
          return transactions;
        }
      },
    }
  }
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
      updatedAt: {
        type: GraphQLString,
        resolve(expense) {
          return expense.updatedAt;
        }
      },
      incurredAt: {
        type: GraphQLString,
        resolve(expense) {
          return expense.incurredAt;
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
          return req.loaders.collective.findById.load(expense.CollectiveId).then(collective => {
            if (req.remoteUser.isAdmin(collective.HostCollectiveId)) {
              return expense.privateMessage;
            } else {
              return null;
            }
          })
        }
      },
      attachment: {
        type: GraphQLString,
        resolve(expense, args, req) {
          if (!req.remoteUser) return null;
          if (req.remoteUser.isAdmin(expense.CollectiveId) || req.remoteUser.id === expense.UserId) {
            return expense.attachment;
          }
          return req.loaders.collective.findById.load(expense.CollectiveId).then(collective => {
            if (req.remoteUser.isAdmin(collective.HostCollectiveId) || req.remoteUser.isAdmin(collective.ParentCollectiveId)) {
              return expense.attachment;
            } else {
              return null;
            }
          })
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
          return expense.getUser().then(u => {
            if (!u) {
              return console.error(`Cannot fetch the UserId ${expense.UserId} referenced in ExpenseId ${expense.id} -- has the user been deleted?`);
            }
            return models.Collective.findById(u.CollectiveId)
          });
        }
      },
      comments: {
        type: CommentListType,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(expense, args) {
          return {
            where: { ExpenseId: expense.id },
            limit: args.limit,
            offset: args.offset
          }
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(expense, args, req) {
          return req.loaders.collective.findById.load(expense.CollectiveId);
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

export const UpdateType = new GraphQLObjectType({
  name: 'UpdateType',
  description: 'This represents an Update',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(expense) {
          return expense.id;
        }
      },
      views: {
        type: GraphQLInt,
        resolve(update) {
          return update.views;
        }
      },
      slug: {
        type: GraphQLString,
        resolve(update) {
          return update.slug;
        }
      },
      image: {
        type: GraphQLString,
        resolve(update) {
          return update.image;
        }
      },
      title: {
        type: GraphQLString,
        resolve(update) {
          return update.title;
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(update) {
          return update.createdAt;
        }
      },
      updatedAt: {
        type: GraphQLString,
        resolve(update) {
          return update.updatedAt;
        }
      },
      publishedAt: {
        type: GraphQLString,
        resolve(update) {
          return update.publishedAt;
        }
      },
      summary: {
        type: GraphQLString,
        resolve(update) {
          if (update.markdown) {
            // we only keep the first paragraph (up to 255 chars)
            return update.markdown.replace(/\n.*/g, '').trunc(255, true);
          }
          if (update.html.substr(0,3) === '<p>') {
            // we only keep the first paragraph
            return he.decode(update.html).replace('<p><br /></p>', '').replace(/<\/p>.*/g, '').replace('<p>','');
          }
          return '';
        }
      },
      html: {
        type: GraphQLString,
        resolve(update) {
          return strip_tags(update.html || "");
        }
      },
      markdown: {
        type: GraphQLString,
        resolve(update) {
          return strip_tags(update.markdown || "");
        }
      },
      tags: {
        type: new GraphQLList(GraphQLString),
        resolve(update) {
          return update.tags;
        }
      },
      createdByUser: {
        type: UserType,
        resolve(update) {
          return update.getUser();
        }
      },
      fromCollective: {
        type: CollectiveInterfaceType,
        resolve(update, args, req) {
          return req.loaders.collective.findById.load(update.FromCollectiveId);
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(update, args, req) {
          return req.loaders.collective.findById.load(update.CollectiveId);
        }
      },
      tier: {
        type: TierType,
        resolve(update, args, req) {
          return req.loaders.tiers.findById.load(update.TierId);
        }
      },
      comments: {
        type: CommentListType,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        resolve(update, args) {
          return {
            where: { UpdateId: update.id },
            limit: args.limit || 10,
            offset: args.offset || 0
          }
        }
      }
    }
  }
});


export const CommentListType = new GraphQLObjectType({
  name: 'CommentListType',
  description: 'List of comments with pagination info',
  fields: () => ({
    comments: {
      type: new GraphQLList(CommentType),
      async resolve(query, args, req) {
        let rows;
        if (query.where.ExpenseId) {
          rows = await req.loaders.comments.findAllByAttribute('ExpenseId').load(query.where.ExpenseId);
        }
        if (query.where.UpdateId) {
          rows = await req.loaders.comments.findAllByAttribute('UpdateId').load(query.where.UpdateId);
        }
        return rows.splice(query.offset, query.limit);
      }
    },
    limit: {
      type: GraphQLInt,
      resolve(query) {
        return query.limit;
      }
    },
    offset: {
      type: GraphQLInt,
      resolve(query) {
        return query.offset;
      }
    },
    total: {
      type: GraphQLInt,
      async resolve(query, args, req) {
        if (query.where.ExpenseId) {
          return req.loaders.comments.countByExpenseId.load(query.where.ExpenseId);
        }
      }
    },
  }),
});


export const CommentType = new GraphQLObjectType({
  name: 'CommentType',
  description: 'This represents a Comment',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(expense) {
          return expense.id;
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(comment) {
          return comment.createdAt;
        }
      },
      updatedAt: {
        type: GraphQLString,
        resolve(comment) {
          return comment.updatedAt;
        }
      },
      html: {
        type: GraphQLString,
        resolve(comment) {
          return strip_tags(comment.html || "");
        }
      },
      markdown: {
        type: GraphQLString,
        resolve(comment) {
          return strip_tags(comment.markdown || "");
        }
      },
      createdByUser: {
        type: UserType,
        resolve(comment) {
          return comment.getUser();
        }
      },
      fromCollective: {
        type: CollectiveInterfaceType,
        resolve(comment, args, req) {
          return req.loaders.collective.findById.load(comment.FromCollectiveId);
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(comment, args, req) {
          return req.loaders.collective.findById.load(comment.CollectiveId);
        }
      },
      expense: {
        type: ExpenseType,
        resolve(comment) {
          return models.Expense.findById(comment.ExpenseId);
        }
      },
      update: {
        type: UpdateType,
        resolve(comment) {
          return models.Update.findById(comment.UpdateId);
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
        type: new GraphQLList(GraphQLInt),
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
          isActive: { type: GraphQLBoolean },
          limit: { type: GraphQLInt }
        },
        resolve(tier, args) {
          const query = {
            where: { processedAt: { [Op.ne]: null } },
            limit: args.limit
          };
          if (args.isActive) {
            query.include = [ { model: models.Subscription, where: { isActive: true } } ];
          }
          return tier.getOrders(query);
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
      transactions: {
        description: 'number of transactions for this order (includes past recurring transactions)',
        type: GraphQLInt,
        resolve(order, args, req) {
          return req.loaders.orders.stats.transactions.load(order.id);
        }
      },
      totalTransactions: {
        description: 'total amount of all the transactions for this order (includes past recurring transactions)',
        type: GraphQLInt,
        resolve(order, args, req) {
          return req.loaders.orders.stats.totalTransactions.load(order.id);
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
          return order.getSubscription()
            .then(s => s ? s.interval : null);
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
          return order.privateMessage; // TODO: should be behind a login check
        }
      },
      fromCollective: {
        description: 'Collective ordering (most of the time it will be the collective of the createdByUser)',
        type: CollectiveInterfaceType,
        resolve(order, args, req) {
          return req.loaders.collective.findById.load(order.FromCollectiveId);
        }
      },
      collective: {
        description: 'Collective that receives the order',
        type: CollectiveInterfaceType,
        resolve(order, args, req) {
          return req.loaders.collective.findById.load(order.CollectiveId);
        }
      },
      referral: {
        description: 'Referral user collective',
        type: CollectiveInterfaceType,
        resolve(order, args, req) {
          return req.loaders.collective.findById.load(order.ReferralCollectiveId);
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
        resolve(order, args, req) {
          if (!req.remoteUser) {
            return null;
          }
          return order.getPaymentMethodForUser(req.remoteUser);
        }
      },
      matchingFund: {
        description: 'Payment method used if this order was matched by a matching fund.',
        type: PaymentMethodType,
        resolve(order) {
          return order.getMatchingPaymentMethod();
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
      currency: {
        type: GraphQLString,
        resolve(order) {
          return order.currency;
        }
      },
      createdAt: {
        type: GraphQLString,
        resolve(order) {
          return order.createdAt;
        }
      },
      // TODO: two fields below (isPastDue & isSubscriptionActive) an possibly be combined as one
      // Leaving them separate for now to make it easy for logged in vs logged out data
      isPastDue: {
        description: 'Whether this subscription is past due or not',
        type: GraphQLBoolean,
        resolve(order, args, req) {
          // if logged out experience, always return false
          if (!req.remoteUser) {
            return false;
          }
          // otherwise, check if this user has permission
          return order.getSubscriptionForUser(req.remoteUser)
            .then(subscription => subscription && subscription.isActive && subscription.chargeRetryCount > 0)
        }
      },
      // Note this field is public
      isSubscriptionActive: {
        description: 'If there is a subscription, is it active?',
        type: GraphQLBoolean,
        resolve(order) {
          return order.getSubscription()
            .then(s => s ? s.isActive : null)
        }
      }
    }
  }
});

// Note: we assume that all of this data is publicly accessible without a login
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
      settings: {
        type: GraphQLJSON,
        resolve(ca) {
          return ca.settings;
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

// TODO: Put behind a login token
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
      createdAt: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.createdAt;
        }
      },
      expiryDate: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.expiryDate;
        }
      },
      service: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.service;
        }
      },
      type: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.type;
        }
      },
      data: {
        type: GraphQLJSON,
        resolve(paymentMethod) {
          if (!paymentMethod.data) {
            return null;
          }
          const data = paymentMethod.data;
          // white list fields to send back; removes fields like CustomerIdForHost
          const dataSubset = {
            fullName: data.fullName,
            expMonth: data.expMonth,
            expYear: data.expYear,
            brand: data.brand,
            country: data.country,
            last4: data.last4
          }
          return dataSubset;
        }
      },
      name: { // last 4 digit of card number for Stripe
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.name;
        }
      },
      description: {
        type: GraphQLString,
        resolve(paymentMethod) {
          return paymentMethod.description;
        }
      },
      primary: {
        type: GraphQLBoolean,
        resolve(paymentMethod) {
          return paymentMethod.primary;
        }
      },
      matching: {
        type: GraphQLInt,
        description: "Matching factor",
        resolve(paymentMethod) {
          return paymentMethod.matching;
        }
      },
      monthlyLimitPerMember: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.monthlyLimitPerMember;
        }
      },
      initialBalance: {
        type: GraphQLInt,
        resolve(paymentMethod) {
          return paymentMethod.initialBalance;
        }
      },
      balance: {
        type: GraphQLInt,
        description: "Returns the balance in the currency of this paymentMethod",
        async resolve(paymentMethod, args, req) {
          const balance = await paymentMethod.getBalanceForUser(req.remoteUser);
          return balance.amount;
        }
      },
      collective: {
        type: CollectiveInterfaceType,
        resolve(paymentMethod, args, req) {
          return req.loaders.collective.findById.load(paymentMethod.CollectiveId);
        }
      },
      limitedToTags: {
        type: GraphQLJSON,
        resolve(paymentMethod) {
          return paymentMethod.limitedToTags;
        }
      },
      limitedToCollectiveIds: {
        type: new GraphQLList(GraphQLInt),
        resolve(paymentMethod) {
          return paymentMethod.limitedToCollectiveIds;
        }
      },
      orders: {
        type: new GraphQLList(OrderType),
        args: {
          hasActiveSubscription: {
            type: GraphQLBoolean,
            description: "Only returns orders that have an active subscription (monthly/yearly)"
          }
        },
        resolve(paymentMethod, args) {
          const query = {};
          if (args.hasActiveSubscription) {
            query.include = [
              { model: models.Subscription, where: { isActive: true }, required: true }
            ]
          }
          return paymentMethod.getOrders(query);
        }
      },
      fromCollectives: {
        type: CollectiveSearchResultsType,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        },
        description: 'Get the list of collectives that used this payment method. Useful to select the list of a backers for which the host has manually added funds or to get the list of backers that used a matching fund',
        async resolve(paymentMethod, args) {
          const res = await models.Transaction.findAll({
            attributes: [ [sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId')), 'FromCollectiveId']],
            where: { PaymentMethodId: paymentMethod.id, type: 'CREDIT' },
            logging: console.log
          });
          const FromCollectiveIds = res.map(r => r.dataValues.FromCollectiveId);
          const result = await models.Collective.findAndCountAll({ where: { id: { [Op.in]: FromCollectiveIds }}});
          const { count, rows } = result;
          return {
            total: count,
            collectives: rows,
            limit: args.limit,
            offset: args.offset,
          };
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


// TODO: Do we even need this type? It's 1:1 mapping with Order.
// Already linked interval and isActive directly in Order table
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

export const ExpenseStatusType = new GraphQLEnumType({
  name: 'ExpenseStatus',
  description: 'Possible statuses for an Expense',
  values: Object.keys(status).reduce((values, key) => ({ ...values, [key]: {} }), {}),
});

export const OrderByType = new GraphQLInputObjectType({
  name: 'OrderByType',
  description: 'Ordering options',
  fields: {
    field: {
      description: '',
      defaultValue: 'createdAt',
      type: new GraphQLEnumType({
        name: 'OrderByField',
        description: 'Properties by which results can be ordered.',
        values: {
          createdAt: {
            description: 'Order result by creation time.',
          },
          updatedAt: {
            description: 'Order result by updated time.',
          },
        },
      }),
    },
    direction: {
      description: 'The ordering direction',
      defaultValue: 'DESC',
      type: OrderDirectionType,
    },
  },
});

OrderByType.defaultValue = Object.entries(OrderByType.getFields()).reduce((values, [key, value]) => ({
  ...values,
  [key]: value.defaultValue,
}), {});

export const PaginatedExpensesType = new GraphQLObjectType({
  name: 'PaginatedExpenses',
  description: 'A list of expenses with pagination info',
  fields: {
    expenses: { type: new GraphQLList(ExpenseType) },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
    total: { type: GraphQLInt },
  },
});

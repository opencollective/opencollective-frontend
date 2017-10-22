import {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInterfaceType,
  GraphQLObjectType
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';
import queries from '../lib/queries';

import {
  LocationType,
  UserType,
  OrderType,
  MemberType,
  TierType,
  PaymentMethodType,
  ConnectedAccountType,
  ExpenseType
} from './types';

import {
  TransactionInterfaceType
} from './TransactionInterface';

import { types } from '../constants/collectives';
import models from '../models';
import roles from '../constants/roles';


export const ExpenseStatsType = new GraphQLObjectType({
  name: "ExpenseStatsType",
  description: "Breakdown of expenses per status (ALL/PENDING/APPROVED/PAID/REJECTED)",
  fields: () => {
    return {
      // We always have to return an id for apollo's caching
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.id;
        }
      },
      all: {
        type: GraphQLInt,
        async resolve(collective, args, req) {
          const expenses = await req.loaders.collective.stats.expenses.load(collective.id) || {};
          let count = 0;
          Object.keys(expenses).forEach(status => count += status !== 'CollectiveId' && expenses[status] || 0);
          return count;
        }
      },
      pending: {
        type: GraphQLInt,
        description: "Returns the number of expenses that are pending",
        async resolve(collective, args, req) {
          const expenses = await req.loaders.collective.stats.expenses.load(collective.id) || {};
          return expenses.PENDING || 0;
        }
      },
      approved: {
        type: GraphQLInt,
        description: "Returns the number of expenses that are approved",
        async resolve(collective, args, req) {
          const expenses = await req.loaders.collective.stats.expenses.load(collective.id) || {};
          return expenses.APPROVED || 0;
        }
      },
      rejected: {
        type: GraphQLInt,
        description: "Returns the number of expenses that are rejected",
        async resolve(collective, args, req) {
          const expenses = await req.loaders.collective.stats.expenses.load(collective.id) || {};
          return expenses.REJECTED || 0;
        }
      },
      paid: {
        type: GraphQLInt,
        description: "Returns the number of expenses that are paid",
        async resolve(collective, args, req) {
          const expenses = await req.loaders.collective.stats.expenses.load(collective.id) || {};
          return expenses.PAID || 0;
        }
      }
    }
  }
});

export const CollectiveStatsType = new GraphQLObjectType({
  name: "CollectiveStatsType",
  description: "Stats for the collective",
  fields: () => {
    return {
      // We always have to return an id for apollo's caching
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.id;
        }
      },
      balance: {
        description: "Amount of money in cents in the currency of the collective currently available to spend",
        type: GraphQLInt,
        resolve(collective, args, req) {
          return req.loaders.collective.balance.load(collective.id);
        }
      },
      backers: {
        description: "Number of individuals that have given money to this collective",
        type: GraphQLInt,
        resolve(collective) {
          return collective.getBackersCount({ type: types.USER });
        }
      },
      sponsors: {
        description: "Number of organizations that have given money to this collective",
        type: GraphQLInt,
        resolve(collective) {
          return collective.getBackersCount({ type: [types.ORGANIZATION, types.COLLECTIVE] });
        }
      },
      collectives: {
        description: "Number of collectives under this collective",
        type: GraphQLInt,
        resolve(collective) {
          return models.Collective.count({ where: { ParentCollectiveId: collective.id } });
        }
      },
      expenses: {
        description: "Breakdown of expenses submitted to this collective by type (ALL/PENDING/APPROVED/PAID/REJECTED)",
        type: ExpenseStatsType,
        resolve(collective) {
          return collective;
        }
      },
      transactions: {
        description: "Number of transactions",
        type: GraphQLInt,
        resolve(collective) {
          return models.Transaction.count({ where: { CollectiveId: collective.id } });
        }
      },
      totalAmountReceived: {
        description: 'Net amount received',
        type: GraphQLInt,
        resolve(collective) {
          return collective.getTotalAmountReceived();
        }
      },
      totalAmountSent: {
        description: 'Net amount donated to other collectives',
        type: GraphQLInt,
        resolve(collective) {
          return collective.getTotalAmountSent();
        }
      },
      yearlyBudget: {
        type: GraphQLInt,
        resolve(collective) {
          // If the current collective is a host, we aggregate the yearly budget across all the hosted collectives
          if (collective.id === collective.HostCollectiveId) {
            return queries.getTotalAnnualBudgetForHost(collective.id);
          }
          return collective.getYearlyIncome();
        }
      },
      topExpenses: {
        type: GraphQLJSON,
        resolve(collective) {
          return Promise.all([
            queries.getTopExpenseCategories(collective.id),
            queries.getTopVendorsForCollective(collective.id)
          ]).then(results => {
            const res = {
              byCategory: results[0],
              byCollective: results[1]
            }
            return res;
          })
        }
      },
      topFundingSources: {
        type: GraphQLJSON,
        resolve(collective) {
          return Promise.all([
            queries.getTopDonorsForCollective(collective.id),
            queries.getTotalDonationsByCollectiveType(collective.id)
          ]).then(results => {
            const res = {
              byCollective: results[0],
              byCollectiveType: results[1]
            };
            return res;
          })
        }
      }
    }
  }
});

export const CollectiveInterfaceType = new GraphQLInterfaceType({
  name: "CollectiveInterface",
  description: "Collective interface",
  resolveType: (collective) => {
    switch (collective.type) {
      case types.COLLECTIVE:
        return CollectiveType;

      case types.USER:
      case types.ORGANIZATION:
        return UserCollectiveType;

      case types.EVENT:
        return EventCollectiveType;

      default:
        return null;
    }
  },
  fields: () => {
    return {
      id: { type: GraphQLInt },
      createdByUser: { type: UserType },
      parentCollective: { type: CollectiveInterfaceType },
      type: { type: GraphQLString },
      isActive: { type: GraphQLBoolean },
      name: { type: GraphQLString },
      description: { type: GraphQLString },
      longDescription: { type: GraphQLString },
      mission: { type: GraphQLString },
      location: {
        type: LocationType,
        description: 'Name, address, lat, long of the location.'
      },
      createdAt: { type: GraphQLString },
      startsAt: { type: GraphQLString },
      endsAt: { type: GraphQLString },
      timezone: { type: GraphQLString },
      maxAmount: { type: GraphQLInt },
      currency: { type: GraphQLString },
      image: { type: GraphQLString },
      backgroundImage: { type: GraphQLString },
      settings: { type: GraphQLJSON },
      slug: { type: GraphQLString },
      isHost: { type: GraphQLBoolean },
      host: { type: CollectiveInterfaceType },
      members: {
        type: new GraphQLList(MemberType),
        description: "List of all collectives that are related to this collective with their membership relationship. Can filter by role (BACKER/MEMBER/ADMIN/HOST/FOLLOWER)",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          role: { type: GraphQLString },
          roles: { type: new GraphQLList(GraphQLString) }
        }
      },
      memberOf: {
        type: new GraphQLList(MemberType),
        description: "List of all collectives that this collective is a member of with their membership relationship. Can filter by role (BACKER/MEMBER/ADMIN/HOST/FOLLOWER)",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          role: { type: GraphQLString },
          roles: { type: new GraphQLList(GraphQLString) }
        }
      },
      collectives: {
        type: new GraphQLList(CollectiveType),
        description: "List of all collectives hosted by this collective",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      followers: {
        type: new GraphQLList(CollectiveInterfaceType),
        description: "List of all followers of this collective",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      maxQuantity: { type: GraphQLInt },
      tiers: { type: new GraphQLList(TierType) },
      orders: { type: new GraphQLList(OrderType) },
      stats: { type: CollectiveStatsType },
      transactions: {
        type: new GraphQLList(TransactionInterfaceType),
        args: {
          type: { type: GraphQLString },
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      expenses: {
        type: new GraphQLList(ExpenseType),
        args: {
          type: { type: GraphQLString },
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          status: { type: GraphQLString },
          includeHostedCollectives: { type: GraphQLBoolean }          
        }
      },
      role: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      website: { type: GraphQLString },
      events: {
        type: new GraphQLList(EventCollectiveType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      paymentMethods: { type: new GraphQLList(PaymentMethodType) },
      connectedAccounts: { type: new GraphQLList(ConnectedAccountType) }
    }
  }
});


const CollectiveFields = () => {
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
      type: CollectiveInterfaceType,
      resolve(collective) {
        return models.Collective.findById(collective.ParentCollectiveId);
      }
    },
    type: {
      type: GraphQLString,
      resolve(collective) {
        return collective.type;
      }
    },
    isActive: {
      type: GraphQLBoolean,
      resolve(collective) {
        return collective.isActive;
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
    createdAt: {
      type: GraphQLString,
      resolve(collective) {
        return collective.createdAt
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
    isHost: {
      description: 'Returns whether this collective can host other collectives (ie. has a Stripe Account connected)',
      type: GraphQLBoolean,
      resolve(collective) {
        return (collective.HostCollectiveId === collective.id);
      }
    },
    host: {
      description: 'Get the host collective that is receiving the money on behalf of this collective',
      type: CollectiveInterfaceType,
      resolve(collective, args, req) {
        if (collective.HostCollectiveId) {
          return req.loaders.collective.findById.load(collective.HostCollectiveId);
        }

        if (collective.ParentCollectiveId) {
          return req.loaders.collective.findById.load(collective.ParentCollectiveId)
            .then(parentCollective => req.loaders.collective.findById.load(parentCollective.HostCollectiveId));
        }

        return null;
      }
    },
    members: {
      description: 'Get all the members of this collective (admins, members, backers, followers)',
      type: new GraphQLList(MemberType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        role: { type: GraphQLString },
        roles: { type: new GraphQLList(GraphQLString) }
      },
      resolve(collective, args) {
        const where = { CollectiveId: collective.id };
        const roles = args.roles || args.role && [ args.role ];
        if (roles && roles.length > 0) {
          where.role = { $in: args.roles };
        }
        return models.Member.findAll({ where, limit: args.limit, offset: args.offset });
      }
    },
    memberOf: {
      description: 'Get all the collective this collective is a member of (as a member, backer, follower, etc.)',
      type: new GraphQLList(MemberType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        role: { type: GraphQLString },
        roles: { type: new GraphQLList(GraphQLString) }
      },
      resolve(collective, args) {
        const where = { MemberCollectiveId: collective.id };
        const roles = args.roles || args.role && [ args.role ];
        if (roles && roles.length > 0) {
          where.role = { $in: args.roles };
        }
        return models.Member.findAll({ where, limit: args.limit, offset: args.offset });
      }
    },
    collectives: {
      type: new GraphQLList(CollectiveType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt }
      },
      resolve(collective, args) {
        return models.Collective.findAll({
          where: { HostCollectiveId: collective.id, type: types.COLLECTIVE },
          limit: args.limit, offset: args.offset
        })
      }
    },
    followers: {
      type: new GraphQLList(CollectiveInterfaceType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt }
      },
      resolve(collective, args) {
        return models.Member.findAll({
          where: { CollectiveId: collective.id, role: roles.FOLLOWER },
          include: [ { model: models.Collective, as: 'memberCollective' } ],
          limit: args.limit, offset: args.offset
        })
        .then(memberships => memberships.memberCollective);
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
        return collective.getTiers({ order: [['amount', 'ASC']] });
      }
    },
    orders: {
      type: new GraphQLList(OrderType),
      resolve(collective) {
        return collective.getIncomingOrders({
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
    expenses: {
      type: new GraphQLList(ExpenseType),
      args: {
        type: { type: GraphQLString },
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        includeHostedCollectives: { type: GraphQLBoolean },
        status: { type: GraphQLString }          
      },
      resolve(collective, args, req) {
        const query = { where: {} };
        if (args.status) query.where.status = args.status;
        if (args.limit) query.limit = args.limit;
        if (args.offset) query.offset = args.offset;
        query.order = [["incurredAt", "DESC"]];
        return req.loaders.collective.findById.load(args.CollectiveId)
          .then(collective => {
            if (!collective) {
              throw new Error('Collective not found');
            }
            const getCollectiveIds = () => {
              // if is host, we get all the expenses across all the hosted collectives
              if (args.includeHostedCollectives) {
                if (collective.HostCollectiveId !== collective.id) {
                  throw new Error("This collective is not a host");
                }
                return models.Member.findAll({
                  where: {
                    MemberCollectiveId: collective.id,
                    role: 'HOST'
                  }
                }).map(members => members.CollectiveId)
              } else {
                return Promise.resolve([args.CollectiveId]);
              }
            }
            return getCollectiveIds().then(collectiveIds => {
              query.where.CollectiveId = { $in: collectiveIds };
              return models.Expense.findAll(query);
            })
          })
      }
    },
    role: {
      type: GraphQLString,
      resolve(collective, args, req) {
        return collective.role || collective.getRoleForMemberCollective(req.remoteUser.CollectiveId);
      }
    },
    twitterHandle: {
      type: GraphQLString,
      resolve(collective) {
        return collective.twitterHandle;
      }
    },
    website: {
      type: GraphQLString,
      resolve(collective) {
        return collective.website;
      }
    },
    events: {
      type: new GraphQLList(EventCollectiveType),
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
    paymentMethods: {
      type: new GraphQLList(PaymentMethodType),
      resolve(collective, args, req) {
        if (!req.remoteUser || !req.remoteUser.isAdmin(collective.id)) return [];

        return models.PaymentMethod.findAll({
          where: {
            CollectiveId: collective.id,
            service: 'stripe',
            name: { $ne: null },
            archivedAt: null
          }
            
        });
      }
    },
    connectedAccounts: {
      type: new GraphQLList(ConnectedAccountType),
      resolve(collective) {
        // For some weird reason, Sequelize function collective.getConnectedAccounts() doesn't return a Promise with .map() ¯\_(ツ)_/¯ 
        return collective.getConnectedAccounts().then(cas => cas.map(ca => ca.info));
      }
    },
    stats: {
      type: CollectiveStatsType,
      resolve(collective) {
        return collective;
      }
    }
  }
};

export const CollectiveType = new GraphQLObjectType({
  name: 'Collective',
  description: 'This represents a Collective',
  interfaces: [ CollectiveInterfaceType ],
  fields: CollectiveFields
});

export const UserCollectiveType = new GraphQLObjectType({
  name: 'User',
  description: 'This represents a User Collective',
  interfaces: [ CollectiveInterfaceType ],
  fields: () => {
    return {
      ...CollectiveFields(),
      firstName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(u => u.firstName);
        }
      },
      lastName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(u => u.lastName);
        }
      },
      email: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          if (!req.remoteUser) return null;
          return userCollective && req.loaders.getUserDetailsByCollectiveId.load(userCollective.id).then(user => user.email);
        }
      }
    }
  }
});

export const EventCollectiveType = new GraphQLObjectType({
  name: 'Event',
  description: 'This represents an Event Collective',
  interfaces: [ CollectiveInterfaceType ],
  fields: CollectiveFields
});

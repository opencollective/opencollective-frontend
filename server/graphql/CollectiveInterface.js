import {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLEnumType,
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
  OrderDirectionType,
  TransactionInterfaceType
} from './TransactionInterface';

import { types } from '../constants/collectives';
import models, { Op } from '../models';
import roles from '../constants/roles';

export const TypeOfCollectiveType = new GraphQLEnumType({
  name: 'TypeOfCollective',
  values: {
    COLLECTIVE: {},
    EVENT: {},
    ORGANIZATION: {},
    USER: {},
  },
});

export const CollectiveOrderFieldType = new GraphQLEnumType({
  name: 'CollectiveOrderField',
  description: 'Properties by which collectives can be ordered.',
  values: {
    balance: {
      description: 'Order collectives by total balance.',
    },
    createdAt: {
      description: 'Order collectives by creation time.',
    },
    name: {
      description: 'Order collectives by name.',
    },
    updatedAt: {
      description: 'Order collectives by updated time.',
    },
  },
});

export const BackersStatsType = new GraphQLObjectType({
  name: "BackersStatsType",
  description: "Breakdown of backers per type (ANY/USER/ORGANIZATION/COLLECTIVE)",
  fields: () => {
    return {
      // We always have to return an id for apollo's caching
      id: {
        type: GraphQLInt,
        resolve(stats) {
          return stats.id;
        }
      },
      all: {
        description: "Total number of backers that have given money to this collective",
        type: GraphQLInt,
        resolve(stats) {
          return stats.all;
        }
      },
      users: {
        description: "Number of individuals that have given money to this collective",
        type: GraphQLInt,
        resolve(stats) {
          return stats.USER || 0;
        }
      },
      organizations: {
        description: "Number of organizations that have given money to this collective",
        type: GraphQLInt,
        resolve(stats) {
          return stats.ORGANIZATION || 0;
        }
      },
      collectives: {
        description: "Number of collectives that have given money to this collective",
        type: GraphQLInt,
        resolve(stats) {
          return stats.COLLECTIVE || 0;
        }
      }
    }
  }
});

export const CollectivesStatsType = new GraphQLObjectType({
  name: "CollectivesStatsType",
  description: "Breakdown of collectives under this collective by role (all/hosted/memberOf/events)",
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
        async resolve(collective) {
          return models.Collective.count({
            where: {
              [Op.or]: {
                ParentCollectiveId: collective.id,
                HostCollectiveId: collective.id
              },
              isActive: true
            }
          });
        }
      },
      hosted: {
        type: GraphQLInt,
        description: "Returns the collectives hosted by this collective",
        async resolve(collective) {
          return models.Collective.count({
            where: {
              HostCollectiveId: collective.id,
              type: types.COLLECTIVE,
              isActive: true
            }
          });
        }
      },
      memberOf: {
        type: GraphQLInt,
        description: "Returns the number of collectives that have this collective has parent",
        async resolve(collective) {
          return models.Collective.count({
            where: {
              ParentCollectiveId: collective.id,
              type: types.COLLECTIVE,
              isActive: true
            }
          });
        }
      },
      events: {
        type: GraphQLInt,
        description: "Returns the number of events that have this collective has parent",
        async resolve(collective) {
          return models.Collective.count({
            where: {
              ParentCollectiveId: collective.id,
              type: types.EVENT,
              isActive: true
            }
          });
        }
      }
    }
  }
});

export const ExpensesStatsType = new GraphQLObjectType({
  name: "ExpensesStatsType",
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

export const TransactionsStatsType = new GraphQLObjectType({
  name: "TransactionsStatsType",
  description: "Breakdown of transactions per type (ALL/CREDIT/DEBIT)",
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
        resolve(collective) {
          return models.Transaction.count({ where: { CollectiveId: collective.id } });
        }
      },
      credit: {
        type: GraphQLInt,
        description: "Returns the number of CREDIT transactions",
        resolve(collective) {
          return models.Transaction.count({ where: { CollectiveId: collective.id, type: 'CREDIT' } });
        }
      },
      debit: {
        type: GraphQLInt,
        description: "Returns the number of DEBIT transactions",
        async resolve(collective) {
          return models.Transaction.count({ where: { CollectiveId: collective.id, type: 'DEBIT' } });
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
        description: "Breakdown of all backers of this collective",
        type: BackersStatsType,
        resolve(collective, args, req) {
          return req.loaders.collective.stats.backers.load(collective.id);
        }
      },
      collectives: {
        description: "Number of collectives under this collective",
        type: CollectivesStatsType,
        resolve(collective) {
          return collective;
        }
      },
      updates: {
        description: "Number of updates published by this collective",
        type: GraphQLInt,
        resolve(collective) {
          return models.Update.count({ where: { CollectiveId: collective.id, publishedAt: { [Op.ne]: null } } });
        }
      },
      events: {
        description: "Number of events under this collective",
        type: GraphQLInt,
        resolve(collective) {
          return models.Collective.count({ where: { ParentCollectiveId: collective.id, type: types.EVENT } });
        }
      },
      expenses: {
        description: "Breakdown of expenses submitted to this collective by type (ALL/PENDING/APPROVED/PAID/REJECTED)",
        type: ExpensesStatsType,
        resolve(collective) {
          return collective;
        }
      },
      transactions: {
        description: "Number of transactions",
        type: TransactionsStatsType,
        resolve(collective) {
          return collective;
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
      totalAmountRaised: {
        description: 'Total amount raised through referral',
        type: GraphQLInt,
        resolve(collective) {
          return collective.getTotalAmountRaised();
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
        return UserCollectiveType;

      case types.ORGANIZATION:
        return OrganizationCollectiveType;

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
      company: { type: GraphQLString },
      description: { type: GraphQLString },
      longDescription: { type: GraphQLString },
      expensePolicy: { type: GraphQLString },
      mission: { type: GraphQLString },
      tags: { type: new GraphQLList(GraphQLString) },
      location: {
        type: LocationType,
        description: 'Name, address, lat, long of the location.'
      },
      createdAt: { type: GraphQLString },
      startsAt: { type: GraphQLString },
      endsAt: { type: GraphQLString },
      timezone: { type: GraphQLString },
      maxAmount: { type: GraphQLInt },
      hostFeePercent: { type: GraphQLInt },
      currency: { type: GraphQLString },
      image: { type: GraphQLString },
      backgroundImage: { type: GraphQLString },
      settings: { type: GraphQLJSON },
      data: { type: GraphQLJSON },
      slug: { type: GraphQLString },
      path: { type: GraphQLString },
      isHost: { type: GraphQLBoolean },
      canApply: { type: GraphQLBoolean },
      host: { type: CollectiveInterfaceType },
      members: {
        type: new GraphQLList(MemberType),
        description: "List of all collectives that are related to this collective with their membership relationship. Can filter by role (BACKER/MEMBER/ADMIN/HOST/FOLLOWER)",
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          type: {
            type: GraphQLString,
            description: "Type of User: USER/ORGANIZATION"
          },
          TierId: { type: GraphQLInt },
          tierSlug: { type: GraphQLString },
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
        type: CollectiveSearchResultsType,
        description: "List of all collectives hosted by this collective",
        args: {
          orderBy: { defaultValue: 'name', type: CollectiveOrderFieldType },
          orderDirection: { defaultValue: 'ASC', type: OrderDirectionType },
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
      tiers: {
        type: new GraphQLList(TierType),
        args: {
          id: { type: GraphQLInt },
          slug: { type: GraphQLString }
        }
      },
      orders: { type: new GraphQLList(OrderType) },
      ordersFromCollective: {
        type: new GraphQLList(OrderType),
        args: {
          subscriptionsOnly: { type: GraphQLBoolean }
        }
      },
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
      updates: {
        type: new GraphQLList(EventCollectiveType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      events: {
        type: new GraphQLList(EventCollectiveType),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt }
        }
      },
      paymentMethods: {
        type: new GraphQLList(PaymentMethodType),
        args: {
          service: { type: GraphQLString },
          limit: { type: GraphQLInt }
        }
      },
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
    company: {
      type: GraphQLString,
      resolve(collective) {
        return collective.company;
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
    expensePolicy: {
      type: GraphQLString,
      resolve(collective) {
        return collective.expensePolicy;
      }
    },
    mission: {
      type: GraphQLString,
      resolve(collective) {
        return collective.mission;
      }
    },
    tags: {
      type: new GraphQLList(GraphQLString),
      resolve(collective) {
        return collective.tags;
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
    hostFeePercent: {
      type: GraphQLInt,
      resolve(collective) {
        return collective.hostFeePercent;
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
    data: {
      type: GraphQLJSON,
      resolve(collective) {
        return collective.data || {};
      }
    },
    slug: {
      type: GraphQLString,
      resolve(collective) {
        return collective.slug;
      }
    },
    path: {
      type: GraphQLString,
      async resolve(collective) {
        return await collective.getUrlPath();
      }
    },
    isHost: {
      description: 'Returns whether this collective can host other collectives (ie. has a Stripe Account connected)',
      type: GraphQLBoolean,
      resolve(collective) {
        return collective.isHost();
      }
    },
    canApply: {
      description: 'Returns whether this host accepts applications for new collectives',
      type: GraphQLBoolean,
      resolve(collective) {
        return Boolean(collective.settings && collective.settings.apply);
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
        type: { type: GraphQLString },
        role: { type: GraphQLString },
        TierId: { type: GraphQLInt },
        tierSlug: { type: GraphQLString },
        roles: { type: new GraphQLList(GraphQLString) }
      },
      resolve(collective, args) {
        const query = {
          limit: args.limit,
          offset: args.offset
        };

        query.where = { CollectiveId: collective.id };
        if (args.TierId) query.where.TierId = args.TierId;
        const roles = args.roles || (args.role && [ args.role ]);

        if (roles && roles.length > 0) {
          query.where.role = { [Op.in]: roles };
        }

        let conditionOnMemberCollective;
        if (args.type) {
          const types = args.type.split(',');
          conditionOnMemberCollective = { type: { [Op.in]: types } };
        }

        query.include = [
          {
            model: models.Collective,
            as: 'memberCollective',
            required: true,
            where: conditionOnMemberCollective
          }
        ];

        if (args.tierSlug) {
          query.include.push({
            model: models.Tier,
            where: { slug: args.tierSlug }
          });
        }

        return models.Member.findAll(query);
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
        const roles = args.roles || (args.role && [ args.role ]);
        if (roles && roles.length > 0) {
          where.role = { [Op.in]: roles };
        }
        return models.Member.findAll({
          where,
          limit: args.limit,
          offset: args.offset,
          include: [{
            model: models.Collective, as: 'collective',
            where: { deletedAt: null },
          }]
        });
      }
    },
    collectives: {
      type: CollectiveSearchResultsType,
      args: {
        orderBy: { defaultValue: 'name', type: CollectiveOrderFieldType },
        orderDirection: { defaultValue: 'ASC', type: OrderDirectionType },
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt }
      },
      async resolve(collective, args) {
        const query = {
          where: { HostCollectiveId: collective.id, type: types.COLLECTIVE },
          order: [ [ args.orderBy, args.orderDirection ] ],
          limit: args.limit, offset: args.offset,
        };
        const result = await models.Collective.findAndCountAll(query);
        const { count, rows } = result;
        return {
          total: count,
          collectives: rows,
          limit: args.limitg,
          offset: args.offset,
        };
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
      args: {
        id: { type: GraphQLInt },
        slug: { type: GraphQLString }
      },
      resolve(collective, args) {
        return collective.getTiers({
          where: args,
          order: [['amount', 'ASC']]
        });
      }
    },
    orders: {
      type: new GraphQLList(OrderType),
      resolve(collective) {
        return collective.getIncomingOrders({
          where: { processedAt: { [Op.ne]: null } },
          order: [ ['createdAt', 'DESC'] ]
        });
      }
    },
    ordersFromCollective: {
      type: new GraphQLList(OrderType),
      args: {
        subscriptionsOnly: { type: GraphQLBoolean }
      },
      resolve(collective, args) {
        const query = {
          where: { }, // TODO: might need a filter of 'processedAt'
          order: [ ['createdAt', 'DESC']]
        };

        if (args.subscriptionsOnly) {
          query.include = [{
            model: models.Subscription,
            required: true
          }]
        }
        return collective.getOutgoingOrders(query)
      }
    },
    transactions: {
      type: new GraphQLList(TransactionInterfaceType),
      args: {
        type: {
          type: GraphQLString,
          description: "type of transaction (DEBIT/CREDIT)"
        },
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
              query.where.CollectiveId = { [Op.in]: collectiveIds };
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
    updates: {
      type: new GraphQLList(EventCollectiveType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt }
      },
      resolve(collective, args) {
        const query = { CollectiveId: collective.id, publishedAt: { [Op.ne]: null } };
        if (args.limit) query.limit = args.limit;
        if (args.offset) query.offset = args.offset;
        return models.Update.findAll(query);
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
      args: {
        service: { type: GraphQLString },
        limit: { type: GraphQLInt }
      },
      resolve(collective, args, req) {
        if (!req.remoteUser || !req.remoteUser.isAdmin(collective.id)) return [];
        return req.loaders.paymentMethods.findByCollectiveId.load(collective.id)
          .then(paymentMethods => {
            if (args.service) {
              paymentMethods = paymentMethods.filter(pm => pm.service === args.service);
            }
            if (args.limit) {
              paymentMethods = paymentMethods.slice(0, args.limit);
            }
            return paymentMethods;
          });
      }
    },
    connectedAccounts: {
      type: new GraphQLList(ConnectedAccountType),
      resolve(collective, args, req) {
        return req.loaders.collective.connectedAccounts.load(collective.id);
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

export const OrganizationCollectiveType = new GraphQLObjectType({
  name: 'Organization',
  description: 'This represents a Organization Collective',
  interfaces: [ CollectiveInterfaceType ],
  fields: () => {
    return {
      ...CollectiveFields(),
      email: {
        type: GraphQLString,
        async resolve(orgCollective, args, req) {
          if (!req.remoteUser) return null;
          return orgCollective && req.loaders.getOrgDetailsByCollectiveId.load(orgCollective.id).then(user => user.email);
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

export const CollectiveSearchResultsType = new GraphQLObjectType({
  name: 'CollectiveSearchResults',
  description: 'The results from searching for collectives with pagination info',
  fields: () => ({
    collectives: {
      type: new GraphQLList(CollectiveType),
    },
    limit: {
      type: GraphQLInt,
    },
    offset: {
      type: GraphQLInt,
    },
    total: {
      type: GraphQLInt,
    },
  }),
});

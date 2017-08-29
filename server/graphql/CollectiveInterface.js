import { hasRole } from '../lib/auth';

import {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLObjectType
} from 'graphql';

import GraphQLJSON from 'graphql-type-json';

import {
  LocationType,
  UserType,
  OrderType,
  MemberType,
  TierType,
  PaymentMethodType,
  ConnectedAccountType
} from './types';

import {
  TransactionInterfaceType
} from './TransactionInterface';

import { types } from '../constants/collectives';
import models from '../models';
import roles from '../constants/roles';

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
      backers: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.getBackersCount();
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
          return collective.getYearlyIncome();
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
      members: {
        type: new GraphQLList(MemberType),
        args: {
          limit: { type: GraphQLInt }
        }
      },
      memberOf: { type: new GraphQLList(MemberType)},
      followers: { type: new GraphQLList(MemberType) },
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
      balance: { type: GraphQLInt },
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
    members: {
      description: 'Get all the members of this collective (admins, members, backers, followers)',
      type: new GraphQLList(MemberType),
      args: {
        limit: { type: GraphQLInt }
      },
      resolve(collective, args) {
        return models.Member.findAll({ where: { CollectiveId: collective.id }, limit: args.limit });
      }
    },
    memberOf: {
      description: 'Get all the collective this collective is a member of (as a member, backer, follower, etc.)',
      type: new GraphQLList(MemberType),
      resolve(collective) {
        return models.Member.findAll({ where: { MemberCollectiveId: collective.id } });
      }
    },
    followers: {
      type: new GraphQLList(MemberType),
      resolve(collective) {
        return models.Member.findAll({ where: { CollectiveId: collective.id, role: roles.FOLLOWER } });
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
    balance: {
      type: GraphQLInt,
      resolve(collective, args, req) {
        return req.loaders.collective.getBalance.load(collective.id);
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
        if (!req.remoteUser) return [];
        return hasRole(req.remoteUser.CollectiveId, collective.id, ['ADMIN'])
          .then(canAccess => {
            if (!canAccess) {
              return [];
            }

            return models.PaymentMethod.findAll({
              where: {
                CollectiveId: collective.id,
                service: 'stripe',
                identifier: { $ne: null },
                archivedAt: null
              }
            });
            
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
          return userCollective && req.loaders.usersByCollectiveId.load(userCollective.id).then(u => u.firstName);
        }
      },
      lastName: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          return userCollective && req.loaders.usersByCollectiveId.load(userCollective.id).then(u => u.lastName);
        }
      },
      email: {
        type: GraphQLString,
        resolve(userCollective, args, req) {
          if (!req.remoteUser) return null;
          if (!userCollective.canAccessUserDetails) return null;
          return userCollective && req.loaders.usersByCollectiveId.load(userCollective.id).then(user => user.email);
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

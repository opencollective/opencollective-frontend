import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  CollectiveInterfaceType
} from './CollectiveInterface';

import {
  TransactionInterfaceType  
} from './TransactionInterface';

import {
  UserType,
  TierType
} from './types';

import models from '../models';

const queries = {
  Collective: {
    type: CollectiveInterfaceType,
    args: {
      slug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args) {
      return models.Collective.findBySlug(args.slug);
    }
  },

  Tier: {
    type: TierType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args) {
      return models.Tier.findById(args.id);
    }
  },

  LoggedInUser: {
    type: UserType,
    resolve(_, args, req) {
      return req.remoteUser;
    }
  },

  /*
   * Given a collective slug, returns all users
   */
  allUsers: {
    type: new GraphQLList(UserType),
    args: {
      slug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args, req) {
      return models.Collective.findOne({ where: { slug: args.slug.toLowerCase() } })
        .then(collective => collective.getUsersForViewer(req.remoteUser));
    }
  },

  /*
   * Given a collective slug, returns all transactions
   */
  allTransactions: {
    type: new GraphQLList(TransactionInterfaceType),
    args: {
      slug: { type: new GraphQLNonNull(GraphQLString) },
      type: { type: GraphQLString },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = {
        include: [
          {
            model: models.Collective, as: 'toCollective',
            where: { slug: args.slug.toLowerCase() }
          }
        ],
        order: [ ['id', 'DESC'] ]
      };
      if (args.type) query.where = { type: args.type };
      if (args.limit) query.limit = args.limit;
      if (args.offset) query.offset = args.offset;
      return models.Transaction.findAll(query);
    }
  },

  /*
   * Given an id, returns a transaction
   */
  Transaction: {
    type: TransactionInterfaceType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(_, args) {
      return models.Transaction.findOne({ where: { id: args.id }});
    }
  },

  /*
   * Given a collective slug, returns all events
   */
  allEvents: {
    type: new GraphQLList(CollectiveInterfaceType),
    args: {
      slug: {
        type: GraphQLString
      }
    },
    resolve(_, args) {
      if (args.slug) {
        return models.Collective
          .findBySlug(args.slug, { attributes: ['id'] })
          .then(collective => models.Collective.findAll({
            where: { ParentCollectiveId: collective.id, type: 'EVENT' },
            order: [['startsAt', 'DESC'], ['createdAt', 'DESC']]
          }))
          .catch(e => {
            console.error(e.message);
            return [];
          })
      } else {
        return models.Collective.findAll({ where: { type: 'EVENT' }});
      }
    }
  }
}

export default queries;
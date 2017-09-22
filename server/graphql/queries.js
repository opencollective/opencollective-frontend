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
  TierType,
  ExpenseType,
  MemberType
} from './types';

import models from '../models';

const queries = {
  Collective: {
    type: CollectiveInterfaceType,
    args: {
      slug: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve(_, args) {
      return models.Collective.findBySlug(args.slug);
    }
  },

  Tier: {
    type: TierType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
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
   * Given a collective slug, returns all transactions
   */
  allTransactions: {
    type: new GraphQLList(TransactionInterfaceType),
    args: {
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      type: { type: GraphQLString },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = {
        where: { CollectiveId: args.CollectiveId },
        order: [ ['id', 'DESC'] ]
      };
      if (args.type) query.where.type = args.type;
      if (args.limit) query.limit = args.limit;
      if (args.offset) query.offset = args.offset;
      return models.Transaction.findAll(query);
    }
  },

  /*
   * Given a collective slug, returns all expenses
   */
  allExpenses: {
    type: new GraphQLList(ExpenseType),
    args: {
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      status: { type: GraphQLString },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = { where: { CollectiveId: args.CollectiveId } }
      if (args.status) query.where.status = args.status;
      if (args.limit) query.limit = args.limit;
      if (args.offset) query.offset = args.offset;
      return models.Expense.findAll(query);
    }
  },

  /*
   * Given an Expense id, returns the expense details
   */
  Expense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) }
    },
    resolve(_, args) {
      return models.Expense.findById(args.id);
    }
  },

  /*
   * Given a Transaction id, returns a transaction details
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
   * Returns all collectives
   */
  allCollectives: {
    type: new GraphQLList(CollectiveInterfaceType),
    args: {
      tags: { type: new GraphQLList(GraphQLString) },
      type: {
        type: GraphQLString,
        description: "COLLECTIVE (default), USER, ORGANIZATION, EVENT"
      },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = {
        where: {},
        limit: args.limit || 10
      };

      if (args.tags) query.where.tags = { $overlap: args.tags };
      if (args.type) query.where.type = args.type;
      if (args.offset) query.offset = args.offset;

      return models.Collective.findAll(query);
    }
  },

  /*
   * Given a collective slug, returns all members
   */
  allMembers: {
    type: new GraphQLList(MemberType),
    args: {
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      TierId: { type: GraphQLInt },
      role: { type: GraphQLString },
      type: { type: GraphQLString },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = { where: { CollectiveId: args.CollectiveId } }
      if (args.TierId) query.where.TierId = args.TierId;
      if (args.role) query.where.role = args.role;
      if (args.type) {
        const types = args.type.split(',');
        query.include = [
          {
            model: models.Collective,
            as: 'memberCollective',
            required: true,
            where: { type: { $in: types } }
          }
        ]
      }
      if (args.limit) query.limit = args.limit;
      if (args.offset) query.offset = args.offset;
      return models.Member.findAll(query);
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
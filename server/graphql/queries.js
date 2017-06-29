import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import {
  CollectiveType,
  TransactionInterfaceType,
  UserType,
  EventType
} from './types';

import models from '../models';

const queries = {
  Collective: {
    type: CollectiveType,
    args: {
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args) {
      return models.Group.findOne({
        where: { slug: args.collectiveSlug.toLowerCase() }
      })
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
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args, req) {
      return models.Group.findOne({ where: { slug: args.collectiveSlug.toLowerCase() } })
        .then(group => group.getUsersForViewer(req.remoteUser));
    }
  },
  /*
   * Given a collective slug, returns all transactions
   */
  allTransactions: {
    type: new GraphQLList(TransactionInterfaceType),
    args: {
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt }
    },
    resolve(_, args) {
      const query = {
        include: [
          {
            model: models.Group,
            where: { slug: args.collectiveSlug.toLowerCase() }
          }
        ],
        order: [ ['id', 'DESC'] ]
      };
      if (args.limit) query.limit = args.limit;
      if (args.offset) query.offset = args.offset;
      return models.Transaction.findAll(query);
    }
  },
  /*
   * Given a collective slug and an event slug, returns the event
   */
  Event: {
    type: EventType,
    args: {
      eventSlug: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Event slug'
      },
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args) {
      return models.Event.findOne({
        where: { slug: args.eventSlug.toLowerCase() },
        include: [{
          model: models.Group,
          where: { slug: args.collectiveSlug.toLowerCase() }
        }]
      })
    }
  },
  /*
   * Given a collective slug, returns all events
   */
  allEvents: {
    type: new GraphQLList(EventType),
    args: {
      collectiveSlug: {
        type: GraphQLString
      }
    },
    resolve(_, args) {
      const where = {};
      if (args.collectiveSlug) {
        where.slug = args.collectiveSlug.toLowerCase();
      }
      return models.Event.findAll({
        include: [{
          model: models.Group,
          where
        }]
      })
    }
  }
}

export default queries;
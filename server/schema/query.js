import {
  GraphQLInt,
  GraphQLList,
  GraphQLString
} from 'graphql';

import {
  EventType
} from './types';

import models from '../models';

const queries = {
  /*
   * Given a group slug and an event slug, returns the event
   */
  getEvent: {
    type: new GraphQLList(EventType),
    args: {
      slug: {
        type: GraphQLString
      },
      groupSlug: {
        type: GraphQLString
      }
    },
    resolve(_, args) {
      return models.Event.findAll({
        where: {
          slug: args.slug
        },
        include: [{
          model: models.Group,
          where: { slug: args.groupSlug }
        }]
      })
    }
  },

  /*
   * Given a group slug, returns all events for that group
   */
  getAllEventsForGroup: {
    type: new GraphQLList(EventType),
    args: {
      groupId: {
        type: GraphQLInt
      },
      groupSlug: {
        type: GraphQLString
      }
    },
    resolve(_, args) {
      return models.Event.findAll({
        include: [{
          model: models.Group,
          where: { 
            $or: {
              slug: args.groupSlug,
              id: args.groupId
            }
          }
        }]
      })
    }
  }
}

export default queries;
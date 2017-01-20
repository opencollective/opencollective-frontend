import {
  GraphQLList,
  GraphQLNonNull,
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
  getEvents: {
    type: new GraphQLList(EventType),
    args: {
      eventSlug: {
        type: GraphQLString,
        description: 'Event slug. If omitted, we return all events from that groupSlug'
      },
      groupSlug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args) {
      const where = {};
      if (args.eventSlug) {
        where.slug = args.eventSlug;
      } 
      return models.Event.findAll({
        where,
        include: [{
          model: models.Group,
          where: { slug: args.groupSlug }
        }]
      })
    }
  }
}

export default queries;
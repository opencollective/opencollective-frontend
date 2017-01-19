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
      const groupSlug = args.groupSlug;
      delete args.groupSlug; // TODO: figure out why _.omit doesn't work in this resolver.
      const where = {};
      if (args.eventSlug) {
        where.slug = eventSlug;
      } 
      return models.Event.findAll({
        where,
        include: [{
          model: models.Group,
          where: { slug: groupSlug }
        }]
      })
    }
  }
}

export default queries;
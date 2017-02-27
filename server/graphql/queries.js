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
  allEventsForCollective: {
    type: new GraphQLList(EventType),
    args: {
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve(_, args) {
      return models.Event.findAll({
        include: [{
          model: models.Group,
          where: { slug: args.collectiveSlug.toLowerCase() }
        }]
      })
    }
  }
}

export default queries;
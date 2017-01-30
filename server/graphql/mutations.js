import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import models from '../models';

import {
  ResponseType
} from './types';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, MEMBER} from '../constants/roles';

const mutations = {
  createResponse: {
    type: ResponseType,
    args: {
      userEmail: {
        type: new GraphQLNonNull(GraphQLString),
      },
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString)
      },
      tierId: {
        type: new GraphQLNonNull(GraphQLInt)
      },
      eventSlug: {
        type: new GraphQLNonNull(GraphQLString)
      },
      quantity: {
        type: new GraphQLNonNull(GraphQLInt)
      },
      confirmedAt: {
        type: GraphQLString
      },
      status: {
        // TODO: switch to enum type
        type: new GraphQLNonNull(GraphQLString)
      },
      description: {
        type: GraphQLString
      }
    },
    resolve(_, args) {

      let tier, user;

      args.userEmail = args.userEmail.toLowerCase();
      return models.Tier.findOne({
        where: {
          id: args.tierId,
        },
        include: [{
          model: models.Event,
          where: {
            slug: args.eventSlug
          },
          include: [{
            model: models.Group,
            where: {
              slug: args.collectiveSlug
            }
          }]
        }]
      })
      .then(t => {
        if (!t) {
          throw new Error(`No tier found with tierId:${args.tierId} for eventSlug:${args.eventSlug} in collectiveSlug:${args.collectiveSlug}`);
        }
        tier = t;
      })
      .then(() => tier.checkAvailableQuantity(args.quantity))
      .tap(console.log)
      .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
              Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

      .then(() => models.User.findOne({
        where: {
          $or: {
            email: args.userEmail,
            paypalEmail: args.userEmail
          }
        }
      }))
      .then(u => u || models.User.create({
        email: args.userEmail
      }))
      .tap(u => user = u)
      .then(() => models.Response.create({
        UserId: user.id,
        GroupId: tier.Event.Group.id,
        EventId: tier.Event.id,
        TierId: tier.id,
        confirmedAt: args.confirmedAt,
        quantity: args.quantity,
        status: args.status,
        description: args.description
      }))
    }
  }
}

export default mutations;
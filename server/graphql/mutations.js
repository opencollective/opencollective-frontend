import models from '../models';

import {
  ResponseType,
  ResponseInputType
} from './types';

// import { hasRole } from '../middleware/security/auth';
// import {HOST, MEMBER} from '../constants/roles';

const mutations = {
  createResponse: {
    type: ResponseType,
    args: {
      response: {
        type: ResponseInputType
      }
    },
    resolve(_, args) {

      let tier, user;
      const response = args.response;
      response.user.email = response.user.email.toLowerCase();
      return models.Tier.findOne({
        where: {
          id: response.tier.id,
        },
        include: [{
          model: models.Event,
          where: {
            slug: response.event.slug
          },
          include: [{
            model: models.Group,
            where: {
              slug: response.group.slug
            }
          }]
        }]
      })
      .then(t => {
        if (!t) {
          throw new Error(`No tier found with tierId:${response.tier.id} for eventSlug:${response.event.slug} in collectiveSlug:${response.group.slug}`);
        }
        tier = t;
      })
      .then(() => tier.checkAvailableQuantity(response.quantity))
      .tap(console.log)
      .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
              Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

      .then(() => models.User.findOne({
        where: {
          $or: {
            email: response.user.email,
            paypalEmail: response.user.email
          }
        }
      }))
      .then(u => u || models.User.create(response.user))
      .tap(u => user = u)
      .then(() => models.Response.create({
        UserId: user.id,
        GroupId: tier.Event.Group.id,
        EventId: tier.Event.id,
        TierId: tier.id,
        confirmedAt: response.confirmedAt,
        quantity: response.quantity,
        status: response.status,
        description: response.description
      }))
    }
  }
}

export default mutations;
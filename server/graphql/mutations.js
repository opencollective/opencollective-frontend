import models from '../models';
import { createPayment } from '../lib/payments';
import emailLib from '../lib/email';

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

      // find the tier, event and group combo
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

      // check for available quantity
      .then(() => tier.checkAvailableQuantity(response.quantity))
      .then(enoughQuantityAvailable => enoughQuantityAvailable ? 
              Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))

      // make sure if it's paid tier, we have a card attached
      .then(() => {
        if (tier.amount > 0) {
          if (response.user.card && response.user.card.token) {
            return Promise.resolve();
          } else {
            return Promise.reject(new Error(`This tier requires a payment method`));
          }
        }
        return Promise.resolve();
      })

      // find or create user
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

      // create response
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

      // record payment, if needed
      .then(responseModel => {
        if (tier.amount > 0) {
          return createPayment({
            user,
            group: tier.Event.Group,
            response: responseModel,
            payment: {
              token: response.user.card.token,
              amount: tier.amount * responseModel.quantity,
              currency: tier.currency,
              description: `${tier.Event.name} - ${tier.name}`,
            }
          })
          .then(() => responseModel);
        } else {
          return emailLib.send(
            'ticket.confirmed',
            user.email,
            { user: user.info,
              group: group.info,
              response: eventResponse.info,
              event: eventResponse.Event.info,
              tier: eventResponse.Tier.info
            })
           .then(() => Promise.resolve(responseModel));
        }
      })
    }
  }
}

export default mutations;
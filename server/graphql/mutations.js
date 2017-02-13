import models from '../models';
import { createPayment } from '../lib/payments';
import emailLib from '../lib/email';
import responseStatus from '../constants/response_status';

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

      let tier, user, event;
      const response = args.response;
      response.user.email = response.user.email.toLowerCase();
      let queryPromise;

      // if "Interested", no tier needed
      if (response.status === responseStatus.INTERESTED) {
        queryPromise = models.Event.findOne({
          where: {
            slug: response.event.slug
          },
          include: [{
            model: models.Group,
            where: {
              slug: response.group.slug
            }
          }]
        })
        .then(ev => {
          if (!ev) {
            throw new Error(`No event found with slug: ${response.event.slug} in collective: ${response.group.slug}`)
          }
          event = ev;
        })
      } else {
        // For all other statuses, need a tier
        queryPromise = models.Tier.findOne({
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
            throw new Error(`No tier found with tier id: ${response.tier.id} for event slug:${response.event.slug} in collective slug:${response.group.slug}`);
          }
          tier = t;
          event = t.Event;
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
      }

      return queryPromise

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
        GroupId: event.Group.id,
        EventId: event.id,
        TierId: tier && tier.id,
        confirmedAt: response.confirmedAt,
        quantity: response.quantity || 0,
        status: response.status,
        description: response.description
      }))

      // record payment, if needed
      .then(responseModel => {

        if (tier && tier.amount > 0 && response.status === responseStatus.YES) {
          return createPayment({
            user,
            group: event.Group,
            response: responseModel,
            payment: {
              token: response.user.card.token,
              amount: tier.amount * responseModel.quantity,
              currency: tier.currency,
              description: `${event.name} - ${tier.name}`,
            }
          })
          .then(() => responseModel);
        } else {
          if (response.status !== responseStatus.INTERESTED) {
            return emailLib.send(
              'ticket.confirmed',
              user.email,
              { user: user.info,
                group: event.Group.info,
                response: responseModel.info,
                event: event.info,
                tier: tier && tier.info
              })
             .then(() => Promise.resolve(responseModel));
           } else {
            return Promise.resolve(responseModel);
           }
        }
      })
    }
  }
}

export default mutations;
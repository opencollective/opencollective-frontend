import _ from 'lodash';

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
      .then(responseModel => {
        if (response.paymentToken && tier.amount > 0) {
          return tier.Group.getStripeAccount()
          .then(stripeAccount => {
            if (!stripeAccount || !stripeAccount.accessToken) {
              return Promise.reject(new Error(`The host for the collective slug ${tier.Group.slug} has no Stripe account set up`));
            } else if (process.env.NODE_ENV !== 'production' && _.contains(stripeAccount.accessToken, 'live')) {
              return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
            } else {
              return Promise.resolve();
            }
          })
          .then(() => models.PaymentMethod.getOrCreate({
            token: response.paymentToken,
            service: 'stripe',
            UserId: user.id 
          }))
          .then(paymetMethod => models.Donation.create({
            UserId: user.id,
            GroupId: tier.Event.Group.id,
            currency: tier.currency,
            amount: tier.amount,
            title: `${tier.Event.name} - ${tier.name}`,
            PaymentMethodId: paymetMethod.id,
          }));
        } else {
          Promise.resolve();
        }
      });
    }
  }
}

export default mutations;
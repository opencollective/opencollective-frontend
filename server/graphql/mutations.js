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

      console.log(JSON.stringify(args.response));

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
        if (response.user.card && response.user.card.token && tier.amount > 0) {
          return tier.Event.Group.getStripeAccount()
          .then(stripeAccount => {
            if (!stripeAccount || !stripeAccount.accessToken) {
              return Promise.reject(new Error(`The host for the collective slug ${tier.Event.Group.slug} has no Stripe account set up`));
            } else if (process.env.NODE_ENV !== 'production' && (stripeAccount.accessToken.indexOf('live') !== -1)) {
              return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
            } else {
              return Promise.resolve();
            }
          })
          .then(() => models.PaymentMethod.getOrCreate({
            token: response.user.card.token,
            service: 'stripe',
            UserId: user.id 
          }))
          .then(paymetMethod => models.Donation.create({
            UserId: user.id,
            GroupId: tier.Event.Group.id,
            currency: tier.currency,
            amount: tier.amount * responseModel.quantity,
            title: `${tier.Event.name} - ${tier.name}`,
            PaymentMethodId: paymetMethod.id,
            ResponseId: responseModel.id
          }))
          .then(() => responseModel);
        } else {
          return Promise.resolve(responseModel);
        }
      })
    }
  }
}

export default mutations;
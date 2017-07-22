import Stripe from 'stripe';
import models from '../models';
import errors from '../lib/errors';
import activities from '../constants/activities';

/**
 * Get subscriptions of a user
 */
export const getAll = (req, res, next) => {
  return models.Subscription.findAll({
    include: [{
      model: models.Order,
      where: {
        UserId: req.remoteUser.id
      },
      include: [
        { model: models.Transaction },
        { model: models.Collective },
        { model: models.User }
      ]
    }]
  })
  .then(subscriptions => res.send(subscriptions))
  .catch(next)
};

/**
 * Cancel a subscription
 */
export const cancel = (req, res, next) => {
  const { subscriptionid } = req.params;

  let order;

  // fetch subscription (through Order)
  return models.Order.find({
    include: [
      { model: models.Collective },
      { model: models.PaymentMethod },
      { model: models.User },
      { model: models.Subscription,
        where: {
          id: subscriptionid
        }
      }]
  })
  .tap(d => order = d)
  .then(d => d ? Promise.resolve() : 
      Promise.reject(new errors.BadRequest(`No subscription found with id ${subscriptionid}. Please contact support@opencollective.com for help.`)))

  // get stripe account for accessToken
  .then(() => order.Collective.getStripeAccount())

  // cancel subscription on Stripe
  .then(stripeAccount => {
    const stripe = Stripe(stripeAccount.accessToken)

    return stripe.customers.cancelSubscription(
      order.PaymentMethod.customerId,
      order.Subscription.stripeSubscriptionId)
  })

  // deactivate Subscription on our end
  .then(() => order.Subscription.deactivate())

  // createActivity
  .then(() => models.Activity.create({
        type: activities.SUBSCRIPTION_CANCELED,
        CollectiveId: order.Collective.id,
        UserId: order.User.id,
        data: {
          subscription: order.Subscription,
          collective: order.Collective.minimal,
          user: order.User.minimal
        }
      }))
  .then(() => res.send({ success: true }))
  .catch(next)
};

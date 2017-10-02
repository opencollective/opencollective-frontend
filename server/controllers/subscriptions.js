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
        CreatedByUserId: req.remoteUser.id
      },
      include: [
        { model: models.Transaction },
        { model: models.Collective, as: 'collective' },
        { model: models.User, as: 'createdByUser' }
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
      { model: models.Collective, as: 'collective' },
      { model: models.PaymentMethod, as: 'paymentMethod' },
      { model: models.User, as: 'createdByUser' },
      { model: models.Subscription,
        where: {
          id: subscriptionid
        }
      }]
  })
  .tap(d => order = d)
  .then(d => d ? Promise.resolve() : 
      Promise.reject(new errors.BadRequest(`No subscription found with id ${subscriptionid}. Please contact support@opencollective.com for help.`)))

  // get stripe account for access token
  .then(() => order.collective.getHostStripeAccount())

  // cancel subscription on Stripe
  .then(stripeAccount => {
    const stripe = Stripe(stripeAccount.token)
    let customerId = order.paymentMethod.customerId;
    const customerIdForHost = order.paymentMethod.data.customerIdForHost;
    if (customerIdForHost && customerIdForHost[stripeAccount.username]) {
      customerId = customerIdForHost[stripeAccount.username];
    }
    return stripe.customers.cancelSubscription(
      customerId,
      order.Subscription.stripeSubscriptionId)
  })

  // deactivate Subscription on our end
  .then(() => order.Subscription.deactivate())
  // createActivity
  .then(() => models.Activity.create({
        type: activities.SUBSCRIPTION_CANCELED,
        CollectiveId: order.collective.id,
        UserId: order.createdByUser.id,
        data: {
          subscription: order.Subscription,
          collective: order.collective.minimal,
          user: order.createdByUser.minimal
        }
      }))
  .then(() => res.send({ success: true }))
  .catch(next)
};

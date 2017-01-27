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
      model: models.Donation,
      where: {
        UserId: req.remoteUser.id
      },
      include: [
        { model: models.Transaction },
        { model: models.Group },
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

  let donation;

  // fetch subscription (through Donation)
  return models.Donation.find({
    include: [
      { model: models.Group },
      { model: models.PaymentMethod },
      { model: models.User },
      { model: models.Subscription,
        where: {
          id: subscriptionid
        }
      }]
  })
  .tap(d => donation = d)
  .then(d => d ? Promise.resolve() : 
      Promise.reject(new errors.BadRequest(`No subscription found with id ${subscriptionid}. Please contact support@opencollective.com for help.`)))

  // get stripe account for accessToken
  .then(() => donation.Group.getStripeAccount())

  // cancel subscription on Stripe
  .then(stripeAccount => {
    const stripe = Stripe(stripeAccount.accessToken)

    return stripe.customers.cancelSubscription(
      donation.PaymentMethod.customerId,
      donation.Subscription.stripeSubscriptionId)
  })

  // deactivate Subscription on our end
  .then(() => donation.Subscription.deactivate())

  // createActivity
  .then(() => models.Activity.create({
        type: activities.SUBSCRIPTION_CANCELED,
        GroupId: donation.Group.id,
        UserId: donation.User.id,
        data: {
          subscription: donation.Subscription,
          group: donation.Group.minimal,
          user: donation.User.minimal
        }
      }))
  .then(() => res.send({ success: true }))
  .catch(next)
};

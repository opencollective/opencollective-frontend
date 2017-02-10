import Promise from 'bluebird';
import _ from 'lodash';

import models from '../models';
import { capitalize } from '../lib/utils';


export const createPayment = (payload) => {
  const { 
    user,
    group,
    response,
    payment
  } = payload;

  const {
    token,
    amount,
    currency,
    description,
    interval
  } = payment;

  const isSubscription = _.includes(['month', 'year'], interval);
  let paymentMethod, title;


  if (interval && !isSubscription) {
    return Promise.reject(new Error('Interval should be month or year.'));
  }

  if (!token) {
    return Promise.reject(new Error('Stripe Token missing.'));
  }

  if (!amount) {
    return Promise.reject(new Error('Payment amount missing'));
  }

  if (amount < 50) {
    return Promise.reject(new Error('Payment amount must be at least $0.50'));
  }

 // fetch Stripe Account and get or create Payment Method
  return Promise.props({
    stripeAccount: group.getStripeAccount(),
    paymentMethod: models.PaymentMethod.getOrCreate({
      token: token,
      service: 'stripe',
      UserId: user.id })
    })
  .then(results => {
    const stripeAccount = results.stripeAccount;
    if (!stripeAccount || !stripeAccount.accessToken) {
      return Promise.reject(new Error(`The host for the collective slug ${group.slug} has no Stripe account set up`));
    } else if (process.env.NODE_ENV !== 'production' && _.includes(stripeAccount.accessToken, 'live')) {
      return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
    } else {
      paymentMethod = results.paymentMethod;
      return Promise.resolve();
    }
  })

  // create a new subscription
  // (this needs to happen first, because of hook on Donation model)
  .then(() => {
    if (isSubscription) {
      title = description || capitalize(`${interval}ly donation to ${group.name}`);
      return models.Subscription.create({
        amount,
        currency,
        interval
      })
    } else {
      title = description || `Donation to ${group.name}`
      return Promise.resolve();
    }
  })
  // create a new donation
  .then(subscription => models.Donation.create({
      UserId: user.id,
      GroupId: group.id,
      currency: currency,
      amount,
      title,
      PaymentMethodId: paymentMethod.id,
      SubscriptionId: subscription && subscription.id,
      ResponseId: response && response.id
    }));
}
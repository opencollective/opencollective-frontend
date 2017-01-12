/*
 * This script tells us which Stripe subscriptions are inactive
 */

const app = require('../server/index');
import models from '../server/models';
import { retrieveSubscription } from '../server/gateways/stripe';
//const stripeGateway = require('../server/gateways').stripe;

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

function run() {
  let inActiveSubscriptionCount = 0;
  let sumAmount = 0;
  return models.Donation.findAll({
    where: { 
      SubscriptionId: {
        $ne: null
      } 
    },
    include: [
      { model: models.Subscription,
        where: { 
          isActive: true,
          stripeSubscriptionId: {
            $ne: null
          } 
        }
      },
      { model: models.Group },
      { model: models.PaymentMethod }
    ]
  })
  .tap(donations => console.log("Total Subscriptions found: ", donations.length))
  .each(donation => {
    console.log(`Processing SubscriptionId: ${donation.SubscriptionId}`);
    return donation.Group.getStripeAccount()
      .then(stripeAccount => retrieveSubscription(stripeAccount, donation.PaymentMethod.customerId, donation.Subscription.stripeSubscriptionId))
      .then(stripeSubscription => {
        if (!stripeSubscription) {
          console.log('Stripe Subscription not found');
        } else {
          console.log('Subscription found!'); 
        }
      })
      .catch(err => {
        if (err.type === 'StripeInvalidRequestError') {
          console.log('Stripe Subscription not found');
          inActiveSubscriptionCount +=1;
          if (donation.currency === 'USD' || donation.currency === 'EUR') {
            sumAmount += donation.amount;
          }
          const subscription = donation.Subscription;
          subscription.isActive = false;
          subscription.deactivatedAt = new Date();
          return subscription.save();
        } else {
          console.log(err);
          Promise.resolve();
        }
      })
  })
  .then(() => console.log("Subscriptions marked inActive: ", inActiveSubscriptionCount))
  .then(() => console.log("Total amount reduced per month (in ~USD): ", sumAmount))
  .then(() => done())
  .catch(done)
}

run();
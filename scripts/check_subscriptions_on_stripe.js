/*
 * This script tells us which Stripe subscriptions are inactive
 */
import argparse from 'argparse';

import models, { Op } from '../server/models';
import { retrieveSubscription } from '../server/paymentProviders/stripe/gateway';

let inactiveSubscriptionCount = 0;
let sumAmount = 0;
const subStatus = {};

const done = err => {
  if (err) console.log('err', err);
  console.log('Subscriptions by status: ', subStatus);
  console.log('Subscriptions marked inactive: ', inactiveSubscriptionCount);
  console.log('Total amount reduced per month (in ~USD): ', sumAmount);
  console.log('done!');
  process.exit();
};

// This generates promises of n-length at a time
// Useful so we don't go over api quota limit on Stripe
const promiseSeq = (arr, predicate, consecutive) => {
  return chunkArray(arr, consecutive).reduce((prom, items, ix) => {
    // wait for the previous Promise.all() to resolve
    return prom.then(() => {
      console.log('processing batch', ix);
      return Promise.all(
        // then we build up the next set of simultaneous promises
        items.map(item => predicate(item, ix)),
      );
    });
  }, Promise.resolve([]));

  function chunkArray(startArray, chunkSize) {
    let j = -1;
    return startArray.reduce((arr, item, ix) => {
      j += ix % chunkSize === 0 ? 1 : 0;
      arr[j] = [...(arr[j] || []), item];
      return arr;
    }, []);
  }
};

const getSubscriptionFromStripe = (order, options) => {
  const { dryRun = true } = options;
  //console.log(`Processing SubscriptionId: ${order.SubscriptionId}`);
  return order.collective
    .getHostStripeAccount()
    .then(stripeAccount =>
      retrieveSubscription(
        stripeAccount,
        order.Subscription.stripeSubscriptionId,
      ),
    )
    .then(stripeSubscription => {
      // if reached here, means subscription found
      // Note: when we upgrade stripe API, this will fail. New API returns cancelled subscriptions as well
      if (stripeSubscription.status in subStatus) {
        subStatus[stripeSubscription.status].subCount += 1;

        const amountKey = stripeSubscription.plan.currency;
        if (amountKey in subStatus[stripeSubscription.status]) {
          subStatus[stripeSubscription.status][amountKey] +=
            stripeSubscription.plan.amount;
        } else {
          subStatus[stripeSubscription.status][amountKey] =
            stripeSubscription.plan.amount;
        }
      } else {
        subStatus[stripeSubscription.status] = { subCount: 0 };
      }
      return Promise.resolve();
    })
    .catch(err => {
      if (dryRun) {
        console.log(err.message);
        console.log('dry run, skipping');
        inactiveSubscriptionCount += 1;
        if (order.currency === 'USD' || order.currency === 'EUR') {
          sumAmount += order.totalAmount;
        }
        return Promise.resolve();
      }
      if (err.type === 'StripeInvalidRequestError') {
        console.log('Stripe Subscription not found - error thrown');
        inactiveSubscriptionCount += 1;
        if (order.currency === 'USD' || order.currency === 'EUR') {
          sumAmount += order.totalAmount;
        }
        const subscription = order.Subscription;
        subscription.isActive = false;
        subscription.deactivatedAt = new Date();
        return subscription.save();
      } else {
        console.log(err);
        Promise.resolve();
      }
    });
};

const checkSubscriptions = options => {
  return models.Order.findAll({
    where: {
      SubscriptionId: {
        [Op.ne]: null,
      },
      PaymentMethodId: {
        [Op.ne]: null,
      },
    },
    include: [
      {
        model: models.Subscription,
        where: {
          isActive: true,
          stripeSubscriptionId: {
            [Op.ne]: null,
          },
        },
      },
      { model: models.Collective, as: 'collective' },
      { model: models.PaymentMethod, as: 'paymentMethod' },
    ],
    order: ['id'],
  })
    .tap(orders => console.log('Total Subscriptions found: ', orders.length))
    .then(orders => {
      if (options.limit > 0) {
        return orders.slice(0, options.limit);
      } else {
        return orders;
      }
    })
    .tap(orders =>
      console.log(
        'Total subscriptions to be processed (from -l arg): ',
        orders.length,
      ),
    )
    .then(orders =>
      promiseSeq(
        orders,
        order => getSubscriptionFromStripe(order, options),
        options.batchSize,
      ),
    )
    .then(() => done())
    .catch(done);
};

const run = () => {
  console.log('\nStarting check_subscriptions_on_stripe...');

  const parser = new argparse.ArgumentParser({
    addHelp: true,
    description: 'Compares subscriptions in our db to stripe',
  });
  parser.addArgument(['--notdryrun'], {
    help: "this flag indicates it's not a dry run",
    defaultValue: false,
    action: 'storeConst',
    constant: true,
  });
  parser.addArgument(['--verbose'], {
    help: 'verbose output',
    defaultValue: false,
    action: 'storeConst',
    constant: true,
  });
  parser.addArgument(['-l', '--limit'], {
    help: 'total subscriptions to process',
  });
  parser.addArgument(['-b', '--batch_size'], {
    help: 'batch size to fetch at a time',
  });
  const args = parser.parseArgs();

  const options = {
    dryRun: !args.notdryrun,
    verbose: args.verbose,
    limit: args.limit,
    batchSize: args.batch_size || 100,
  };

  if (options.dryRun) {
    console.log('*** dry run ***');
  } else {
    console.log('\n\n******************************************');
    console.log('*************** NOT DRY RUN **************');
    console.log('**** THIS WILL MAKE CHANGES IN PRODUCTION ****');
    console.log('******************************************\n\n');
  }

  console.log('Using args: ', options);

  return checkSubscriptions(options)
    .then(() => done())
    .catch(done);
};

const exitHandler = (options, err) => {
  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) {
    console.log('reached here');
    done();
    process.exit();
  }
};

process.stdin.resume(); //so the program will not close instantly
//do something when app is closing
//process.on('exit', exitHandler.bind(null, { exit: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

run();

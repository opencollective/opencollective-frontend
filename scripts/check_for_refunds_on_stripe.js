/*
 * This script tells us which transactions have been refunded on Stripe
 */

const app = require('../server/index');
import models, { Op } from '../server/models';
import { retrieveCharge } from '../server/gateways/stripe';

const done = err => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

function promiseSeq(arr, predicate, consecutive = 100) {
  return chunkArray(arr, consecutive).reduce((prom, items, ix) => {
    // wait for the previous Promise.all() to resolve
    return prom.then(allResults => {
      console.log('SET', ix);
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
}

let refundCount = 0;

function getCharge(transaction) {
  return transaction.Collective.getStripeAccount()
    .then(stripeAccount => {
      if (stripeAccount && transaction.data && transaction.data.charge) {
        return retrieveCharge(stripeAccount, transaction.data.charge.id).then(
          charge => {
            if (charge) {
              if (charge.refunded) {
                refundCount++;
                console.log('Charge Refunded, txn id: ', transaction.id);
              }
            } else {
              console.log('Charge not found: ', transaction.data.charge.id);
            }
          },
        );
      }
      return Promise.resolve();
    })
    .catch(err => {
      // do nothing
      // console.log(err);
    });
}

function run() {
  return models.Transaction.findAll({
    where: {
      type: 'DONATION',
      data: {
        [Op.ne]: null,
      },
    },
    include: [{ model: models.Collective }],
    order: [['id', 'DESC']],
  })
    .tap(transactions =>
      console.log('Transactions found: ', transactions.length),
    )
    .then(transactions => promiseSeq(transactions, (txn, ix) => getCharge(txn)))
    .then(() => console.log('Refund count: ', refundCount))
    .then(() => done())
    .catch(done);
}

run();

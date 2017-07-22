const _ = require('lodash');
const app = require('../server/index');
const config = require('config');
import models from '../server/models';
const constants = require('../server/constants/transactions');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

// Updates a transaction row, given a donation
const updateTransaction = (donation, transaction) => {
  transaction.type = constants.type.DONATION;
  transaction.OrderId = order.id;
  transaction.platformFee = order.amount*0.05;
  return transaction.save();
};

// Creates a Donation row, given a transaction
const createDonation = (transaction) => {
  const donation = {
    UserId: transaction.UserId,
    CollectiveId: transaction.CollectiveId,
    currency: transaction.currency,
    amount: transaction.amount*100,
    title: transaction.description,
    SubscriptionId: transaction.SubscriptionId,
  };

  return models.Order.create(order);
}

// Get all transactions
models.Transaction.findAll({
  where: {
    amount: {
      $gt: 0
    },
    OrderId: null // this ensures that we don't reprocess a transaction
  },
  order: 'id'
})
.map(transaction => {
  console.log("Processing transaction id: ", transaction.id);

  // one-time donations
  if (!transaction.SubscriptionId) {
    return createDonation(transaction)
    .then(order => updateTransaction(donation, transaction))
  } else {
    // recurring donations

    // check if a donation for this SubscriptionId already exists
    return models.Order.findOne({
      where: {
        SubscriptionId: transaction.SubscriptionId
      }
    })
    .then(order => {
      if (!order) {
        return createDonation(transaction)
        .then(order => updateTransaction(donation, transaction))
      } else {
        return updateTransaction(donation, transaction);
      }
    });
  }
})
.then(() => done())
.catch(done)

const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
const async = require('async');
const activities = require('../app/constants/activities');

var thisWeekRaw = moment()
    .tz('America/New_York')
    .startOf('isoWeek')
    .add(9, 'hours');
const thisWeek = thisWeekRaw.format();
const lastWeek = thisWeekRaw.subtract(1, 'week').format();

const createdAtClause = {
  $gt: lastWeek,
  $lt: thisWeek
};
const donationClause = {
  createdAt: createdAtClause,
  tags: {
    $contains: ['Donation']
  }
};
const expenseClause = {
  createdAt: createdAtClause,
  amount: {
    $lt: 0
  }
};

async.auto({
  donationCount: cb => {
    models.Transaction
        .count({ where: donationClause })
        .then(donationCount => cb(null, donationCount))
        .catch(cb);
  },

  expenseCount: cb => {
    models.Transaction
        .count({ where: expenseClause })
        .then(expenseCount => cb(null, expenseCount))
        .catch(cb);
  },

  stripeReceivedCount: cb => {
    models.Activity
        .count({
          where: {
            createdAt: createdAtClause,
            type: activities.WEBHOOK_STRIPE_RECEIVED
          }
        })
        .then(stripeReceivedCount => cb(null, stripeReceivedCount))
        .catch(cb);
  },

  donationAmounts: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', {
          plain: false,
          group: ['currency'],
          attributes: ['currency'],
          where: donationClause
        })
        .then(currencies => cb(null, currencies))
        .catch(cb);
  },

  expenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', {
          plain: false,
          group: ['currency'],
          attributes: ['currency'],
          where: expenseClause
        })
        .then(currencies => cb(null, currencies))
        .catch(cb);
  }
}, (err, results) => {
  if (err) {
    console.log('err', err);
  } else {
    console.log('Result: ' + JSON.stringify(results));
  }
  process.exit();
});

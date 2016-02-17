const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
const async = require('async');
const activities = require('../app/constants/activities');
const slackLib = require('../app/lib/slack');

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

  donationAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', {
          plain: false,
          group: ['currency'],
          attributes: ['currency'],
          where: donationClause
        })
        .map(row => ' ' + row.SUM + ' ' + row.currency)
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
        .map(row => ' ' + -row.SUM + ' ' + row.currency)
        .then(currencies => cb(null, currencies))
        .catch(cb);
  }
}, (err, results) => {
  if (err) {
    console.log('err', err);
  } else {
    slackLib.postMessage(transactionReportString(results));
  }
  process.exit();
});

function transactionReportString(results) {
  return `Summary:\n` +
      `- ${results.donationCount} donations received\n` +
      `- ${results.expenseCount} expenses filed\n` +
      `- ${results.stripeReceivedCount} payments received from Stripe\n` +
      `Details:\n` +
      `- total amount collected:${results.donationAmount}\n` +
      `- total expenses approved:${results.expenseAmount}\n`;
}
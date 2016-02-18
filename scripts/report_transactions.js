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
        .done(cb);
  },

  expenseCount: cb => {
    models.Transaction
        .count({ where: expenseClause })
        .done(cb);
  },

  stripeReceivedCount: cb => {
    models.Activity
        .count({
          where: {
            createdAt: createdAtClause,
            type: activities.WEBHOOK_STRIPE_RECEIVED
          }
        })
        .done(cb);
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
        .done(cb);
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
        .done(cb);
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
  return `Summary:
- ${results.donationCount} donations received
- ${results.expenseCount} expenses filed
- ${results.stripeReceivedCount} payments received from Stripe
Details:
- total amount collected:${results.donationAmount}
- total expenses approved:${results.expenseAmount}`;
}
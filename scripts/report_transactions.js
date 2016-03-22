const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
const async = require('async');
const activities = require('../app/constants/activities');
const slackLib = require('../app/lib/slack');

const today = new Date();

// Heroku scheduler only has daily or hourly cron jobs, we only want to run
// this script once per week on Monday (1). If the day is not Monday on production
// we won't execute the script
if (process.env.NODE_ENV === 'production' && today.getDay() !== 1) {
  console.log('NODE_ENV is production and day is not Monday, script aborted!');
  process.exit();
}

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
  amount: { $gt: 0 }
};
const expenseClause = {
  $lt: 0
};
const unapprovedExpenseClause = {
  createdAt: createdAtClause,
  amount: expenseClause,
  approved: false
};
const approvedExpenseClause = {
  createdAt: createdAtClause,
  amount: expenseClause,
  approved: true
};

async.auto({
  donationCount: cb => {
    models.Transaction
        .count({ where: donationClause })
        .done(cb);
  },

  unapprovedExpenseCount: cb => {
    models.Transaction
        .count({ where: unapprovedExpenseClause })
        .done(cb);
  },

  approvedExpenseCount: cb => {
    models.Transaction
        .count({ where: approvedExpenseClause })
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

  unapprovedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', {
          plain: false,
          group: ['currency'],
          attributes: ['currency'],
          where: unapprovedExpenseClause
        })
        .map(row => ' ' + -row.SUM + ' ' + row.currency)
        .done(cb);
  },

  approvedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', {
          plain: false,
          group: ['currency'],
          attributes: ['currency'],
          where: approvedExpenseClause
        })
        .map(row => ' ' + -row.SUM + ' ' + row.currency)
        .done(cb);
  }
}, (err, results) => {
  if (err) {
    console.log('err', err);
    process.exit();
  } else {
    const report = transactionReportString(results);

    console.log(report);

    slackLib.postMessage(report)
    .then(() => {
      console.log('Reporting done!');
      process.exit();
    });
  }
});

function transactionReportString(results) {
  return `Weekly transactions summary:
- ${results.donationCount} donations received
- ${results.unapprovedExpenseCount} expenses pending approval
- ${results.approvedExpenseCount} approved expenses
- ${results.stripeReceivedCount} payments received from Stripe
Details:
- total amount collected:${results.donationAmount}
- total expenses pending approval:${results.unapprovedExpenseAmount}
- total approved expenses:${results.approvedExpenseAmount}`;
}

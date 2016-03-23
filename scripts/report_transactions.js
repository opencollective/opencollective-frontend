const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
const async = require('async');
const _ = require('lodash');
const activities = require('../app/constants/activities');
const slackLib = require('../app/lib/slack');

onlyExecuteInProdOnMondays();

const timeFrameClause = getTimeFrame();
const donations = {
  where: {
    createdAt: timeFrameClause,
    amount: {$gt: 0}
  }
};
const expenseClause = {
  $lt: 0
};
const unapprovedExpenses = {
  where: {
    createdAt: timeFrameClause,
    amount: expenseClause,
    approved: false
  }
};
const approvedExpenses = {
  where: {
    createdAt: timeFrameClause,
    amount: expenseClause,
    approved: true
  }
};
const currencyAggregate = {
  plain: false,
  group: ['currency'],
  attributes: ['currency'],
  order: ['currency']
};

async.auto({
  donationCount: cb => {
    models.Transaction
        .count(donations)
        .done(cb);
  },

  unapprovedExpenseCount: cb => {
    models.Transaction
        .count(unapprovedExpenses)
        .done(cb);
  },

  approvedExpenseCount: cb => {
    models.Transaction
        .count(approvedExpenses)
        .done(cb);
  },

  stripeReceivedCount: cb => {
    models.Activity
        .count({
          where: {
            createdAt: timeFrameClause,
            type: activities.WEBHOOK_STRIPE_RECEIVED
          }
        })
        .done(cb);
  },

  activeCollectiveCount: cb => {
    models.Transaction
      .aggregate('GroupId', 'COUNT', {
        plain: false,
        distinct: true,
        where: { updatedAt: timeFrameClause }
      })
      .map(row => row.COUNT)
      .done(cb);
  },

  donationAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.extend({}, currencyAggregate, donations))
        .map(row => ' ' + row.SUM + ' ' + row.currency)
        .done(cb);
  },

  unapprovedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.extend({}, currencyAggregate, unapprovedExpenses))
        .map(row => ' ' + -row.SUM + ' ' + row.currency)
        .done(cb);
  },

  approvedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.extend({}, currencyAggregate, approvedExpenses))
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

    // slackLib.postMessage(report)
    // .then(() => {
    //   console.log('Reporting done!');
    //   process.exit();
    // });
    process.exit();
  }
});

/**
 * Heroku scheduler only has daily or hourly cron jobs, we only want to run
 * this script once per week on Monday (1). If the day is not Monday on production
 * we won't execute the script
 */
function onlyExecuteInProdOnMondays() {
  const today = new Date();
  if (process.env.NODE_ENV === 'production' && today.getDay() !== 1) {
    console.log('NODE_ENV is production and day is not Monday, script aborted!');
    process.exit();
  }
}

function getTimeFrame() {
  const thisWeekStartRaw = moment()
    .tz('America/New_York')
    .startOf('isoWeek')
    .add(9, 'hours');
  const thisWeekStart = thisWeekStartRaw.format();
  const lastWeekStart = thisWeekStartRaw.subtract(1, 'week').format();

  return {
    $gt: lastWeekStart,
    $lt: thisWeekStart
  };
}

function transactionReportString(results) {
  return `Weekly transactions summary:
- ${results.donationCount} donations received ${results.donationAmount ? `totaling${results.donationAmount}` : ''}
- ${results.unapprovedExpenseCount} unapproved expenses ${results.unapprovedExpenseAmount ? `totaling${results.unapprovedExpenseAmount}` : ''}
- ${results.approvedExpenseCount} approved expenses ${results.approvedExpenseAmount ? `totaling${results.approvedExpenseAmount}` : ''}
- ${results.stripeReceivedCount} payments received from Stripe
- ${results.activeCollectiveCount} active collectives`;
}

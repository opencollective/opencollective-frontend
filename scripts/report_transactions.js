const app = require('../index');
const models = app.set('models');
const moment = require('moment-timezone');
const async = require('async');
const _ = require('lodash');
const activities = require('../app/constants/activities');
const slackLib = require('../app/lib/slack');

onlyExecuteInProdOnMondays();

const createdLastWeek = getTimeFrame('createdAt');
const updatedLastWeek = getTimeFrame('updatedAt');

const donation = { where: { amount: { $gt: 0 } } };
const expense = { where: { amount: { $lt: 0 } } };

const approved = { where: { approved: true } };
const unapproved = { where: { approved: false } };

const lastWeekDonations = _.merge({}, createdLastWeek, donation);

const unapprovedLastWeekExpenses = _.merge({}, createdLastWeek, unapproved, expense);
const approvedLastWeekExpenses = _.merge({}, createdLastWeek, approved, expense);

const groupByCurrency = {
  plain: false,
  group: ['currency'],
  attributes: ['currency'],
  order: ['currency']
};

async.auto({
  donationCount: cb => {
    models.Transaction
        .count(lastWeekDonations)
        .done(cb);
  },

  unapprovedExpenseCount: cb => {
    models.Transaction
        .count(unapprovedLastWeekExpenses)
        .done(cb);
  },

  approvedExpenseCount: cb => {
    models.Transaction
        .count(approvedLastWeekExpenses)
        .done(cb);
  },

  stripeReceivedCount: cb => {
    const stripeReceived = { where: { type: activities.WEBHOOK_STRIPE_RECEIVED } };
    models.Activity
        .count(_.merge({}, createdLastWeek, stripeReceived))
        .done(cb);
  },

  activeCollectiveCount: cb => {
    const distinct = {
      plain: false,
      distinct: true
    };
    models.Transaction
      .aggregate('GroupId', 'COUNT', _.merge({}, updatedLastWeek, distinct))
      .map(row => row.COUNT)
      .done(cb);
  },

  newCollectiveCount: cb => {
    models.Group
      .count(createdLastWeek)
      .done(cb);
  },

  donationAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.merge({}, lastWeekDonations, groupByCurrency))
        .map(row => ' ' + row.SUM + ' ' + row.currency)
        .done(cb);
  },

  unapprovedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.merge({}, unapprovedLastWeekExpenses, groupByCurrency))
        .map(row => ' ' + -row.SUM + ' ' + row.currency)
        .done(cb);
  },

  approvedExpenseAmount: cb => {
    models.Transaction
        .aggregate('amount', 'SUM', _.merge({}, approvedLastWeekExpenses, groupByCurrency))
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

function getTimeFrame(propName) {
  const thisWeekStartRaw = moment()
    .tz('America/New_York')
    .startOf('isoWeek')
    .add(9, 'hours');
  const thisWeekStart = thisWeekStartRaw.format();
  const lastWeekStart = thisWeekStartRaw.subtract(1, 'week').format();

  return {
    where: {
      [propName]: {
        $gt: lastWeekStart,
        $lt: thisWeekStart
      }
    }
  };
}

function transactionReportString(results) {
  return `Weekly transactions summary:
- ${results.donationCount} donations received ${results.donationAmount ? `totaling${results.donationAmount}` : ''}
- ${results.unapprovedExpenseCount} unapproved expenses ${results.unapprovedExpenseAmount ? `totaling${results.unapprovedExpenseAmount}` : ''}
- ${results.approvedExpenseCount} approved expenses ${results.approvedExpenseAmount ? `totaling${results.approvedExpenseAmount}` : ''}
- ${results.stripeReceivedCount} payments received from Stripe
- ${results.activeCollectiveCount} active collectives
- ${results.newCollectiveCount} new collectives`;
}

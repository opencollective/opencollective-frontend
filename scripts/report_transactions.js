const app = require('../index');
const Promise = require('bluebird');
const models = app.set('models');
const moment = require('moment-timezone');
const _ = require('lodash');
const activities = require('../server/constants/activities');
const slackLib = require('../server/lib/slack');

onlyExecuteInProdOnMondays();

const Transaction = models.Transaction;
const Activity = models.Activity;
const Group = models.Group;

const createdLastWeek = getTimeFrame('createdAt');
const updatedLastWeek = getTimeFrame('updatedAt');

const donation = { where: { DonationId: { $not: null } } };
const expense = { where: { amount: { $lt: 0 } } };

const pendingExpense = { where: { approvedAt: null } };
const approvedExpense = { where: { approved: true } };
const rejectedExpense = { where: {
  approved: false,
  approvedAt: { $not: null }
} };

const excludeOcTeam = { where: {
  UserId: {
    $notIn: [
      1,  // arnaudbenard
      2,  // xdamman
      7,  // maru
      8,  // aseem
      30, // pmancini
      40, // opencollective
      41, // asood123
      80  // Maru Lango
    ]
  },
  GroupId: {
    $not: 1 // OpenCollective group
  }
} };

const lastWeekDonations = _.merge({}, createdLastWeek, donation, excludeOcTeam);
const lastWeekExpenses = _.merge({}, createdLastWeek, expense, excludeOcTeam);

const pendingLastWeekExpenses = _.merge({}, lastWeekExpenses, pendingExpense);
const approvedLastWeekExpenses = _.merge({}, lastWeekExpenses, approvedExpense);
const rejectedLastWeekExpenses = _.merge({}, lastWeekExpenses, rejectedExpense);

const groupByCurrency = {
  plain: false,
  group: ['currency'],
  attributes: ['currency'],
  order: ['currency']
};

const stripeReceived = { where: { type: activities.WEBHOOK_STRIPE_RECEIVED } };

const distinct = {
  plain: false,
  distinct: true
};

Promise.props({

  // Donation statistics

  donationCount: Transaction.count(lastWeekDonations),

  donationAmount: Transaction
    .aggregate('amount', 'SUM', _.merge({}, lastWeekDonations, groupByCurrency))
    .map(row => `${row.SUM} ${row.currency}`),

  stripeReceivedCount: Activity.count(_.merge({}, createdLastWeek, stripeReceived)),

  // Expense statistics

  pendingExpenseCount: Transaction.count(pendingLastWeekExpenses),

  approvedExpenseCount: Transaction.count(approvedLastWeekExpenses),

  rejectedExpenseCount: Transaction.count(rejectedLastWeekExpenses),

  pendingExpenseAmount: Transaction
    .aggregate('amount', 'SUM', _.merge({}, pendingLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM} ${row.currency}`),

  approvedExpenseAmount: Transaction
    .aggregate('amount', 'SUM', _.merge({}, approvedLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM} ${row.currency}`),

  rejectedExpenseAmount: Transaction
    .aggregate('amount', 'SUM', _.merge({}, rejectedLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM} ${row.currency}`),

  // Collective statistics

  activeCollectiveCount: Transaction
    .aggregate('GroupId', 'COUNT', _.merge({}, updatedLastWeek, distinct, excludeOcTeam))
    .map(row => row.COUNT),

  newCollectives: Group
    .findAll(_.merge({}, { attributes: ['slug']}, createdLastWeek))
    .map(group => group.dataValues.slug)

}).then(results => {
  const report = transactionReportString(results);
  console.log(report);
  return slackLib.postActivityOnPrivateChannel(report);
}).then(() => {
  console.log('Reporting done!');
  process.exit();
}).catch(err => {
  console.log('err', err);
  process.exit();
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
  return `Weekly transactions summary (excluding OC team transactions):
\`\`\`
* Donations:
  - ${results.donationCount} donations received${displayTotals(results.donationAmount)}
  - ${results.stripeReceivedCount} payments received from Stripe
* Expenses:
  - ${results.pendingExpenseCount} pending expenses${displayTotals(results.pendingExpenseAmount)}
  - ${results.approvedExpenseCount} approved expenses${displayTotals(results.approvedExpenseAmount)}
  - ${results.rejectedExpenseCount} rejected expenses${displayTotals(results.rejectedExpenseAmount)}
* Collectives:
  - ${results.activeCollectiveCount} active collectives
  - ${results.newCollectives.length} new collectives${displayCollectives(results.newCollectives)}
\`\`\``;
}

function displayTotals(totals) {
  if(totals.length > 0) {
    return ` totaling:\n    * ${totals.join('\n    * ').trim()}`;
  }
  return "";
}

function displayCollectives(collectives) {
  if(collectives.length > 0) {
    return `:\n    * ${collectives.join('\n    * ').trim()}`;
  }
  return "";
}

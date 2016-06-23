const app = require('../index');
const config = require('config');
const Promise = require('bluebird');
const models = app.set('models');
const moment = require('moment-timezone');
const _ = require('lodash');
const activities = require('../server/constants/activities');
const slackLib = require('../server/lib/slack');
const expenseStatus = require('../server/constants/expense_status')
onlyExecuteInProdOnMondays();

const Transaction = models.Transaction;
const Expense = models.Expense;
const Activity = models.Activity;
const Group = models.Group;

const createdLastWeek = getTimeFrame('createdAt');
const updatedLastWeek = getTimeFrame('updatedAt');

const donation = { where: { DonationId: { $not: null } } };

const pendingExpense = { where: { status: expenseStatus.PENDING } };
const approvedExpense = { where: { status: expenseStatus.APPROVED } };
const rejectedExpense = { where: { status: expenseStatus.REJECTED } };
const paidExpense = { where : { status: expenseStatus.PAID } };

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
const lastWeekExpenses = _.merge({}, updatedLastWeek, excludeOcTeam);

const pendingLastWeekExpenses = _.merge({}, lastWeekExpenses, pendingExpense);
const approvedLastWeekExpenses = _.merge({}, lastWeekExpenses, approvedExpense);
const rejectedLastWeekExpenses = _.merge({}, lastWeekExpenses, rejectedExpense);
const paidLastWeekExpenses = _.merge({}, lastWeekExpenses, paidExpense);

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

  pendingExpenseCount: Expense.count(pendingLastWeekExpenses),

  approvedExpenseCount: Expense.count(approvedLastWeekExpenses),

  rejectedExpenseCount: Expense.count(rejectedLastWeekExpenses),

  paidExpenseCount: Expense.count(paidLastWeekExpenses),

  pendingExpenseAmount: Expense
    .aggregate('amount', 'SUM', _.merge({}, pendingLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM/100} ${row.currency}`),

  approvedExpenseAmount: Expense
    .aggregate('amount', 'SUM', _.merge({}, approvedLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM/100} ${row.currency}`),

  rejectedExpenseAmount: Expense
    .aggregate('amount', 'SUM', _.merge({}, rejectedLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM/100} ${row.currency}`),

  paidExpenseAmount: Expense
    .aggregate('amount', 'SUM', _.merge({}, paidLastWeekExpenses, groupByCurrency))
    .map(row => `${-row.SUM/100} ${row.currency}`),

  // Collective statistics

  activeCollectivesWithTransactions: Transaction
    .findAll(_.merge({attributes: ['GroupId'] }, updatedLastWeek, distinct, excludeOcTeam))
    .map(row => row.GroupId),

  activeCollectivesWithExpenses: Expense
    .findAll(_.merge({attributes: ['GroupId'] }, updatedLastWeek, distinct, excludeOcTeam))
    .map(row => row.GroupId),

  newCollectives: Group
    .findAll(_.merge({}, { attributes: ['slug']}, createdLastWeek))
    .map(group => group.dataValues.slug)

}).then(results => {
  results.activeCollectiveCount = _.union(results.activeCollectivesWithTransactions, results.activeCollectivesWithExpenses).length
  const report = transactionReportString(results);
  console.log(report);
  return slackLib.postMessage(report, config.slack.webhookUrl, { channel: config.slack.privateActivityChannel });
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

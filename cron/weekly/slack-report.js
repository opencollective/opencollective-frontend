import config from 'config';
import Promise from 'bluebird';
import moment from 'moment-timezone';
import _ from 'lodash';
import merge from 'merge-options';
import models, { Op } from '../../server/models';
import activities from '../../server/constants/activities';
import slackLib from '../../server/lib/slack';
import expenseStatus from '../../server/constants/expense_status';

if (!process.env.MANUAL) {
  onlyExecuteInProdOnMondays();
}

const {
  Activity,
  Collective,
  Expense,
  PaymentMethod,
  Transaction,
} = models;

const createdLastWeek = getTimeFrame('createdAt', process.env.START_DATE);
const updatedLastWeek = getTimeFrame('updatedAt', process.env.START_DATE);

const weekBefore = moment(process.env.START_DATE).tz('America/New_York').startOf('isoWeek').subtract(1, 'week');

const createdWeekBefore = getTimeFrame('createdAt', weekBefore);
const updatedWeekBefore = getTimeFrame('updatedAt', weekBefore);
const donation = {
  where: {
    OrderId: {
      [Op.not]: null
    },
    platformFeeInHostCurrency: {
      [Op.lt]: 0
    }
  }
};

const pendingExpense = { where: { status: expenseStatus.PENDING } };
const approvedExpense = { where: { status: expenseStatus.APPROVED } };
const rejectedExpense = { where: { status: expenseStatus.REJECTED } };
const paidExpense = { where : { status: expenseStatus.PAID } };

const credit = { where: {type: 'CREDIT'}};

const excludeOcTeam = { where: {
  CollectiveId: {
    [Op.not]: 1 // OpenCollective collective
  }
} };

const lastWeekDonations = merge({}, createdLastWeek, donation, excludeOcTeam, credit);
const lastWeekExpenses = merge({}, updatedLastWeek, excludeOcTeam);

const pendingLastWeekExpenses = merge({}, lastWeekExpenses, pendingExpense);
const approvedLastWeekExpenses = merge({}, lastWeekExpenses, approvedExpense);
const rejectedLastWeekExpenses = merge({}, lastWeekExpenses, rejectedExpense);
const paidLastWeekExpenses = merge({}, lastWeekExpenses, paidExpense);

const weekBeforeDonations = merge({}, createdWeekBefore, donation, excludeOcTeam, credit);
const paidWeekBeforeExpenses = merge({}, updatedWeekBefore, excludeOcTeam, paidExpense);

const collectiveByCurrency = {
  plain: false,
  group: ['currency'],
  attributes: ['currency'],
  order: ['currency']
};

const onlyIncludeCollectiveType = {
  include: [{
    model: Collective,
    as: 'collective',
    where: {
      type: 'COLLECTIVE'
    }
  }]
};

const includePaypalPayments = {
  include: [{
    attributes: [],
    model: PaymentMethod,
    where: {
      service: 'paypal',
    },
  }],
};

const paypalReceived = { where: { type: activities.WEBHOOK_PAYPAL_RECEIVED } };

const distinct = {
  plain: false,
  distinct: true
};

export default function run() {
  return Promise.props({

    // Donation statistics

    donationCount: Transaction.count(lastWeekDonations),

    priorDonationCount: Transaction.count(weekBeforeDonations),

    paypalDonationCount: Transaction.count(merge({}, lastWeekDonations, includePaypalPayments)),

    priorPaypalDonationCount: Transaction.count(merge({}, weekBeforeDonations, includePaypalPayments)),

    donationAmount: Transaction
      .aggregate('amount', 'SUM', merge({}, lastWeekDonations, collectiveByCurrency)),

    priorDonationAmount: Transaction
      .aggregate('amount', 'SUM', merge({}, weekBeforeDonations, collectiveByCurrency)),

    paypalReceivedCount: Activity.count(merge({}, createdLastWeek, paypalReceived)),

    paypalDonationAmount: Transaction
      .sum('amount', merge({}, lastWeekDonations, includePaypalPayments)),

    priorPaypalDonationAmount: Transaction
      .sum('amount', merge({}, weekBeforeDonations, includePaypalPayments)),

    // Expense statistics

    pendingExpenseCount: Expense.count(pendingLastWeekExpenses),

    approvedExpenseCount: Expense.count(approvedLastWeekExpenses),

    rejectedExpenseCount: Expense.count(rejectedLastWeekExpenses),

    paidExpenseCount: Expense.count(paidLastWeekExpenses),

    priorPaidExpenseCount: Expense.count(paidWeekBeforeExpenses),

    pendingExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, pendingLastWeekExpenses, collectiveByCurrency))
      .map(row => `${-row.SUM/100} ${row.currency}`),

    approvedExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, approvedLastWeekExpenses, collectiveByCurrency))
      .map(row => `${-row.SUM/100} ${row.currency}`),

    rejectedExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, rejectedLastWeekExpenses, collectiveByCurrency))
      .map(row => `${-row.SUM/100} ${row.currency}`),

    paidExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, paidLastWeekExpenses, collectiveByCurrency)),

    priorPaidExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, paidWeekBeforeExpenses, collectiveByCurrency)),

    // Collective statistics

    activeCollectivesWithTransactions: Transaction
      .findAll(merge({attributes: ['CollectiveId'] }, createdLastWeek, distinct, excludeOcTeam, onlyIncludeCollectiveType))
      .map(row => row.CollectiveId),

    priorActiveCollectivesWithTransactions: Transaction
      .findAll(merge({attributes: ['CollectiveId'] }, createdWeekBefore, distinct, excludeOcTeam, onlyIncludeCollectiveType))
      .map(row => row.CollectiveId),

    activeCollectivesWithExpenses: Expense
      .findAll(merge({attributes: ['CollectiveId'] }, updatedLastWeek, distinct, excludeOcTeam))
      .map(row => row.CollectiveId),

    priorActiveCollectivesWithExpenses: Expense
      .findAll(merge({attributes: ['CollectiveId'] }, updatedWeekBefore, distinct, excludeOcTeam))
      .map(row => row.CollectiveId),

    newCollectives: Collective
      .findAll(merge({}, { attributes: ['slug', 'tags'], where: { type: 'COLLECTIVE' } }, createdLastWeek))
      .map(collective => {
        const openSource = collective.dataValues.tags && collective.dataValues.tags.indexOf('open source') !== -1;
        return `${collective.dataValues.slug} (${openSource ? 'open source' : collective.dataValues.tags})`
      }),

    priorNewCollectivesCount: Collective.count(merge({}, { where: { type: 'COLLECTIVE' } }, createdWeekBefore)),

  }).then(results => {
    results.activeCollectiveCount = _.union(results.activeCollectivesWithTransactions, results.activeCollectivesWithExpenses).length;
    results.priorActiveCollectiveCount = _.union(results.priorActiveCollectivesWithTransactions, results.priorActiveCollectivesWithExpenses).length;
    const report = reportString(results);
    console.log(report);
    return slackLib.postMessage(report, config.slack.webhookUrl, { channel: config.slack.privateActivityChannel });
  }).then(() => {
    console.log('Weekly reporting done!');
    process.exit();
  }).catch(err => {
    console.log('err', err);
    process.exit();
  });
}

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

function getTimeFrame(propName, startDate) {
  const thisWeekStartRaw = moment(startDate) // will default to now if START_DATE is not set
    .tz('America/New_York')
    .startOf('isoWeek')
    .add(9, 'hours');
  const thisWeekStart = thisWeekStartRaw.format();
  const lastWeekStart = thisWeekStartRaw.subtract(1, 'week').format();

  return {
    where: {
      [propName]: {
        [Op.gt]: lastWeekStart,
        [Op.lt]: thisWeekStart
      }
    }
  };
}

function reportString({
  activeCollectiveCount,
  approvedExpenseAmount,
  approvedExpenseCount,
  donationAmount,
  donationCount,
  newCollectives,
  paidExpenseAmount,
  paidExpenseCount,
  paypalDonationAmount,
  paypalDonationCount,
  pendingExpenseAmount,
  pendingExpenseCount,
  priorActiveCollectiveCount,
  priorDonationAmount,
  priorDonationCount,
  priorNewCollectivesCount,
  priorPaidExpenseAmount,
  priorPaypalDonationAmount,
  priorPaypalDonationCount,
  priorPaidExpenseCount,
  rejectedExpenseAmount,
  rejectedExpenseCount,
}) {
  return `Weekly activity summary (excluding OC team):
\`\`\`
* Donations:
  - ${donationCount} (${compareNumbers(donationCount, priorDonationCount)}) donations received totaling:
    ${donationAmount.map(({ SUM, currency }) => `* ${SUM/100} ${currency} (${compareNumbers(SUM/100, getSum(priorDonationAmount, currency)/100)})`).join('\n    ')}
  - ${paypalDonationCount} (${compareNumbers(paypalDonationCount, priorPaypalDonationCount)}) paypal donations received totaling:
    * ${paypalDonationAmount/100} USD (${compareNumbers(paypalDonationAmount/100, priorPaypalDonationAmount/100)})
* Expenses:
  - ${pendingExpenseCount} pending expenses${displayTotals(pendingExpenseAmount)}
  - ${approvedExpenseCount} approved expenses${displayTotals(approvedExpenseAmount)}
  - ${rejectedExpenseCount} rejected expenses${displayTotals(rejectedExpenseAmount)}
  - ${paidExpenseCount} (${compareNumbers(paidExpenseCount, priorPaidExpenseCount)}) paid expenses totaling:
    ${paidExpenseAmount.map(({ SUM, currency }) => `* ${-SUM/100} ${currency} (${compareNumbers(SUM/100, getSum(priorPaidExpenseAmount, currency)/100)})`).join('\n    ')}
* Collectives:
  - ${activeCollectiveCount} (${compareNumbers(activeCollectiveCount, priorActiveCollectiveCount)}) active collectives
  - ${newCollectives.length} (${compareNumbers(newCollectives.length, priorNewCollectivesCount)}) new collectives${displayCollectives(newCollectives)}
\`\`\``;
}

function displayTotals(totals) {
  if (totals.length > 0) {
    return ` totaling:\n    * ${totals.join('\n    * ').trim()}`;
  }
  return "";
}

function displayCollectives(collectives) {
  if (collectives.length > 0) {
    return `:\n    * ${collectives.join('\n    * ').trim()}`;
  }
  return "";
}

function compareNumbers(recentNumber, priorNumber) {
  const diff = Math.round(recentNumber - priorNumber);
  return `${diff >= 0 ? 'increase' : 'decrease'} of ${diff}`;
}

function getSum(collection, currency) {
  const record = _.find(collection, { currency });
  return record ? record.SUM : 0;
}

run();

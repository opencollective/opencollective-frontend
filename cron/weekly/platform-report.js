import Promise from 'bluebird';
import moment from 'moment-timezone';
import _ from 'lodash';
import merge from 'merge-options';
import models, { Op } from '../../server/models';
import activities from '../../server/constants/activities';
import emailLib from '../../server/lib/email';
import expenseStatus from '../../server/constants/expense_status';
import { formatCurrency } from '../../server/lib/utils';
import showdown from 'showdown';
const markdownConverter = new showdown.Converter();

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
const title = `Weekly Platform Report`;
const subtitle = `Week ${weekBefore.week()} from ${weekBefore.format('YYYY-MM-DD')} till ${moment(process.env.START_DATE).format('YYYY-MM-DD')}`;
const createdWeekBefore = getTimeFrame('createdAt', weekBefore);
const updatedWeekBefore = getTimeFrame('updatedAt', weekBefore);
const donation = {
  where: {
    OrderId: {
      [Op.not]: null
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

const collectiveByCurrency = (table) => {
  return {
    plain: false,
    group: [ `${table}.currency` ],
    attributes: ['currency'],
    order: ['currency']
  }
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

const service = (service) => {
  return {
    include: [{
      attributes: [],
      model: PaymentMethod,
      required: true,
      where: {
        service,
      },
    }],
  };
};

const paypalReceived = { where: { type: activities.WEBHOOK_PAYPAL_RECEIVED } };

const distinct = {
  plain: false,
  distinct: true
};

export default function run() {
  return Promise.props({

    // Donation statistics

    stripeDonationCount: Transaction.count(merge({}, lastWeekDonations, service('stripe'))),

    priorStripeDonationCount: Transaction.count(merge({}, weekBeforeDonations, service('stripe'))),

    manualDonationCount: Transaction.count(merge({}, lastWeekDonations, service('opencollective'))),

    priorManualDonationCount: Transaction.count(merge({}, weekBeforeDonations, service('opencollective'))),

    paypalDonationCount: Transaction.count(merge({}, lastWeekDonations, service('paypal'))),

    priorPaypalDonationCount: Transaction.count(merge({}, weekBeforeDonations, service('paypal'))),

    stripeDonationAmount: Transaction
      .aggregate('amount', 'SUM', merge({}, lastWeekDonations, collectiveByCurrency('Transaction'))),

    priorStripeDonationAmount: Transaction
      .aggregate('amount', 'SUM', merge({}, weekBeforeDonations, collectiveByCurrency('Transaction'))),

    manualDonationAmount: Transaction
      .aggregate('amount', 'SUM', merge({}, lastWeekDonations, collectiveByCurrency('Transaction'), service('opencollective'))),

    priorManualDonationAmount: Transaction
      .sum('amount', merge({}, weekBeforeDonations, service('opencollective'))),

    paypalReceivedCount: Activity.count(merge({}, createdLastWeek, paypalReceived)),

    paypalDonationAmount: Transaction
      .sum('amount', merge({}, lastWeekDonations, service('paypal'))),

    priorPaypalDonationAmount: Transaction
      .sum('amount', merge({}, weekBeforeDonations, service('paypal'))),

    // Expense statistics

    pendingExpenseCount: Expense.count(pendingLastWeekExpenses),

    approvedExpenseCount: Expense.count(approvedLastWeekExpenses),

    rejectedExpenseCount: Expense.count(rejectedLastWeekExpenses),

    paidExpenseCount: Expense.count(paidLastWeekExpenses),

    priorPaidExpenseCount: Expense.count(paidWeekBeforeExpenses),

    pendingExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, pendingLastWeekExpenses, collectiveByCurrency('Expense')))
      .map(row => `${row.currency} ${formatCurrency(row.SUM, row.currency)}`),

    approvedExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, approvedLastWeekExpenses, collectiveByCurrency('Expense')))
      .map(row => `${row.currency} ${formatCurrency(row.SUM, row.currency)}`),

    rejectedExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, rejectedLastWeekExpenses, collectiveByCurrency('Expense')))
      .map(row => `${row.currency} ${formatCurrency(row.SUM, row.currency)}`),

    paidExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, paidLastWeekExpenses, collectiveByCurrency('Expense'))),

    priorPaidExpenseAmount: Expense
      .aggregate('amount', 'SUM', merge({}, paidWeekBeforeExpenses, collectiveByCurrency('Expense'))),

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
      .findAll(merge({}, { attributes: ['slug', 'name', 'tags'], where: { type: 'COLLECTIVE' } }, createdLastWeek))
      .map(collective => {
        const openSource = collective.dataValues.tags && collective.dataValues.tags.indexOf('open source') !== -1;
        return `[${collective.dataValues.name || collective.dataValues.slug}](https://opencollective.com/${collective.dataValues.slug}) (${openSource ? 'open source' : collective.dataValues.tags})`
      }),

    priorNewCollectivesCount: Collective.count(merge({}, { where: { type: 'COLLECTIVE' } }, createdWeekBefore)),

  }).then(results => {
    results.activeCollectiveCount = _.union(results.activeCollectivesWithTransactions, results.activeCollectivesWithExpenses).length;
    results.priorActiveCollectiveCount = _.union(results.priorActiveCollectivesWithTransactions, results.priorActiveCollectivesWithExpenses).length;
    const report = reportString(results);
    console.log(report);
    const html = markdownConverter.makeHtml(report);
    return emailLib.sendMessage('team@opencollective.com', title, html, { tag: 'platform-weekly-report' });
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
  stripeDonationAmount,
  stripeDonationCount,
  manualDonationAmount,
  manualDonationCount,
  newCollectives,
  paidExpenseAmount,
  paidExpenseCount,
  paypalDonationAmount,
  paypalDonationCount,
  pendingExpenseAmount,
  pendingExpenseCount,
  priorActiveCollectiveCount,
  priorStripeDonationAmount,
  priorStripeDonationCount,
  priorManualDonationAmount,
  priorManualDonationCount,
  priorNewCollectivesCount,
  priorPaidExpenseAmount,
  priorPaypalDonationAmount,
  priorPaypalDonationCount,
  priorPaidExpenseCount,
  rejectedExpenseAmount,
  rejectedExpenseCount,
}) {
  return `# ${title}
${subtitle}

## Donations
  - STRIPE: ${stripeDonationCount} donations received (${compareNumbers(stripeDonationCount, priorStripeDonationCount)})
    ${stripeDonationAmount.map(({ SUM, currency }) => `* ${currency} ${formatCurrency(SUM, currency)} (${compareNumbers(SUM, getSum(priorStripeDonationAmount, currency), (n) => formatCurrency(n, currency))})`).join('\n    ')}
  - PAYPAL: ${paypalDonationCount} paypal donations received (${compareNumbers(paypalDonationCount, priorPaypalDonationCount)})
    * USD ${formatCurrency(paypalDonationAmount, 'USD')} (${compareNumbers(paypalDonationAmount, priorPaypalDonationAmount, (n) => formatCurrency(n, 'USD'))})
  - MANUAL: ${manualDonationCount} donations received (${compareNumbers(manualDonationCount, priorManualDonationCount)})
    ${manualDonationAmount.map(({ SUM, currency }) => `* ${currency} ${formatCurrency(SUM, currency)} (${compareNumbers(SUM, getSum(priorManualDonationAmount, currency), (n) => formatCurrency(n, currency))})`).join('\n    ')}

## Expenses
  - ${paidExpenseCount} paid expenses (${compareNumbers(paidExpenseCount, priorPaidExpenseCount)})
    ${paidExpenseAmount.map(({ SUM, currency }) => `* ${currency} ${formatCurrency(SUM, currency)}  (${compareNumbers(SUM, getSum(priorPaidExpenseAmount, currency), (n) => formatCurrency(n, currency))})`).join('\n    ')}
  - ${pendingExpenseCount} pending expenses${displayTotals(pendingExpenseAmount)}
  - ${approvedExpenseCount} approved expenses${displayTotals(approvedExpenseAmount)}
  - ${rejectedExpenseCount} rejected expenses${displayTotals(rejectedExpenseAmount)}

## Collectives
  - ${activeCollectiveCount} active collectives (${compareNumbers(activeCollectiveCount, priorActiveCollectiveCount)})
  - ${newCollectives.length} new collectives (${compareNumbers(newCollectives.length, priorNewCollectivesCount)})${displayCollectives(newCollectives)}


Note: this reports excludes activities on the [OC team collective](https://opencollective.com/opencollective-company)
`;
}

function displayTotals(totals) {
  if (totals.length > 0) {
    return `\n    * ${totals.join('\n    * ').trim()}`;
  }
  return "";
}

function displayCollectives(collectives) {
  if (collectives.length > 0) {
    return `:\n    * ${collectives.join('\n    * ').trim()}`;
  }
  return "";
}

function compareNumbers(recentNumber, priorNumber, formatter = (number) => number) {
  const diff = Math.round(recentNumber - priorNumber);
  return `${diff >= 0 ? '+' : ''}${formatter(diff)}`;
}

function getSum(collection, currency) {
  const record = _.find(collection, { currency });
  return record ? record.SUM : 0;
}

run();

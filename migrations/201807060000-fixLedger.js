'use strict';
const DRY_MODE = false;
import Promise from 'bluebird';
import nock from 'nock';
import moment from 'moment';
import { get } from 'lodash';
import { getFxRate } from '../server/lib/currency';

if (process.env.RECORD) {
  nock.recorder.rec();
}

let transactionsFixed = 0;
let transactionsUpdated = 0;
let failedUpdates = 0;
let warnings = 0;
let invalidTransactions = 0;
let transactionsProcessed = 0;
const queries = [];
const errorsObject = {};

const updateLedgerEntry = (transaction, updateData) => {
  transactionsUpdated++;
  const newTransaction = {
    ...transaction,
    ...updateData,
    data: JSON.stringify(transaction.data),
    updatedAt: new Date(),
  };

  delete newTransaction.collective;
  delete newTransaction.host;
  delete newTransaction.hostCollectiveCurrency;
  delete newTransaction.id;
  const query = `
  BEGIN;
  UPDATE "Transactions" SET "deletedAt"=:transaction_deletedAt WHERE id=:transaction_id;
  INSERT INTO "Transactions" ("${Object.keys(newTransaction).join('","')}") VALUES (:${Object.keys(newTransaction).join(
    ',:',
  )});
  COMMIT;`;
  if (DRY_MODE) {
    // console.log(">>> updateLedgerEntry", newTransaction);
    // console.log(query);
    return;
  }
  queries.push({
    query,
    replacements: {
      ...newTransaction,
      transaction_id: transaction.id,
      transaction_deletedAt: new Date(),
    },
  });
};

const addPaymentProcessorFee = transaction => {
  switch (transaction.type) {
    case 'DEBIT':
      if (
        transaction.netAmountInCollectiveCurrency !=
        transaction.amount + transaction.paymentProcessorFeeInHostCurrency
      ) {
        const newNetAmount = transaction.amount + transaction.paymentProcessorFeeInHostCurrency;
        // console.log(">>> addPaymentProcessorFee", transaction.type, "id", transaction.id, "amount:", transaction.amount, transaction.currency, "paymentProcessorFee:", transaction.paymentProcessorFeeInHostCurrency, transaction.hostCurrency, "net amount:", transaction.netAmountInCollectiveCurrency, "new net amount: ", newNetAmount);
        return { netAmountInCollectiveCurrency: newNetAmount };
      }
      break;
    case 'CREDIT':
      if (
        transaction.amount !=
        transaction.netAmountInCollectiveCurrency - transaction.paymentProcessorFeeInHostCurrency
      ) {
        const newAmount = transaction.netAmountInCollectiveCurrency - transaction.paymentProcessorFeeInHostCurrency;
        // console.log(">>> addPaymentProcessorFee", transaction.type, "id", transaction.id, "amount:", transaction.amount, transaction.currency, "paymentProcessorFee:", transaction.paymentProcessorFeeInHostCurrency, transaction.hostCurrency, "net amount:", transaction.netAmountInCollectiveCurrency, "new amount: ", newAmount);
        return { amount: newAmount };
      }
      break;
  }
};

const verifyTransaction = (tr, accuracy = 0) => {
  if (tr.hostCollectiveCurrency && tr.hostCurrency !== tr.hostCollectiveCurrency) return false; // if there is a discrepency between tr.hostCurrency and tr.host.currency
  if (tr.currency !== tr.hostCurrency) {
    if (!tr.hostCurrencyFxRate || tr.hostCurrencyFxRate === 1) return false;
  }
  if (tr.hostFeeInHostCurrency > 0 || tr.platformFeeInHostCurrency > 0 || tr.paymentProcessorFeeInHostCurrency > 0) {
    return false;
  }
  const fees = tr.hostFeeInHostCurrency + tr.platformFeeInHostCurrency + tr.paymentProcessorFeeInHostCurrency || 0;
  const netAmountInCollectiveCurrency = Math.round((tr.amountInHostCurrency + fees) / tr.hostCurrencyFxRate);
  if (netAmountInCollectiveCurrency === tr.netAmountInCollectiveCurrency) {
    return true;
  } else {
    if (relativeDiffInPercentage(netAmountInCollectiveCurrency, tr.netAmountInCollectiveCurrency) < accuracy) {
      // console.log(">>> ", tr.id, "netAmountInCollectiveCurrency != tr.netAmountInCollectiveCurrency by ", relativeDiffInPercentage(netAmountInCollectiveCurrency, tr.netAmountInCollectiveCurrency));
      return true;
    } else {
      return false;
    }
  }
};

const cols = [
  'date',
  'host',
  'host.currency',
  'collective',
  'type',
  'transaction.amount',
  'transaction.currency',
  'amountInHostCurrency',
  'update',
  'delta',
  'hostCurrency',
  'hostCurrencyFxRate',
  'newHostCurrencyFxRate',
  'hostFeeInHostCurrency',
  'platformFeeInHostCurrency',
  'paymentProcessorFeeInHostcurrency',
  'totalFeesInCollectiveCurrency',
  'netAmountInCollectiveCurrency',
  'update',
  'delta',
  'OrderId',
  'ExpenseId',
  'TransactionGroup',
  'reason',
  'fix',
  'fixValid',
];
console.log(cols.join('|'));

const relativeDiffInPercentage = (a, b) => {
  return Math.abs(Math.round((Math.abs(a - b) / Math.min(a, b)) * 10000) / 10000);
};

const isRefundTransaction = tr => {
  if (!tr.RefundTransactionId) return false;
  return tr.description.match(/^Refund of /);
};

const fixTransaction = async tr => {
  transactionsProcessed++;
  if (!tr) return;
  if (verifyTransaction(tr)) {
    return;
  }
  invalidTransactions++;

  let update = {},
    newFxRate,
    reasons = [];

  if (tr.ExpenseId && tr.paymentProcessorFeeInHostCurrency < 0) {
    reasons.push('payment processor fee not accounted for');
    update = addPaymentProcessorFee(tr) || {};
  }

  if (tr.hostFeeInHostCurrency > 0 && !isRefundTransaction(tr)) {
    reasons.push('hostFeeInHostCurrency should be negative');
    update.hostFeeInHostCurrency = -tr.hostFeeInHostCurrency;
  }
  if (tr.platformFeeInHostCurrency > 0 && !isRefundTransaction(tr)) {
    reasons.push('platformFeeInHostCurrency should be negative');
    update.platformFeeInHostCurrency = -tr.platformFeeInHostCurrency;
  }
  if (tr.paymentProcessorFeeInHostCurrency > 0 && !isRefundTransaction(tr)) {
    reasons.push('paymentProcessorFeeInHostCurrency should be negative');
    update.paymentProcessorFeeInHostCurrency = -tr.paymentProcessorFeeInHostCurrency;
  }

  const stripeAccountCurrency = get(tr, 'data.balanceTransaction.currency');
  if (stripeAccountCurrency) {
    if (stripeAccountCurrency != (tr.hostCurrency || '').toLowerCase()) {
      reasons.push("hostCurrency doesn't match Stripe account currency");
      update.hostCurrency = stripeAccountCurrency.toUpperCase();
    }
  } else if (!tr.hostCurrency) {
    reasons.push('missing host currency');
    if (tr.hostCollectiveCurrency) {
      update.hostCurrency = tr.hostCollectiveCurrency;
    }
  } else if (tr.hostCollectiveCurrency && tr.hostCurrency !== tr.hostCollectiveCurrency) {
    reasons.push("hostCurrency doesn't match host.currency");
    update.hostCurrency = tr.hostCollectiveCurrency;
  }

  if (update.hostCurrency) {
    tr.hostCurrency = update.hostCurrency;
  }

  if (!tr.hostCollectiveCurrency) {
    errorsObject[tr.HostCollectiveId] = `${tr.host} (id: ${tr.HostCollectiveId}) doesn't have a currency set`;
  } else if (tr.hostCurrency !== tr.hostCollectiveCurrency) {
    errorsObject[tr.HostCollectiveId] = `${tr.host} (id: ${tr.HostCollectiveId}) has a wrong currency set (${
      tr.hostCollectiveCurrency
    }, should be ${tr.hostCurrency})`;
  }

  // fix amount in host currency for transactions in the same currency
  if (tr.currency === tr.hostCurrency) {
    if (tr.hostCurrencyFxRate !== 1) {
      reasons.push('invalid hostCurrencyFxRate');
      update.hostCurrencyFxRate = 1;
    }
    if (tr.amount !== tr.amountInHostCurrency) {
      reasons.push('invalid amountInHostCurrency');
      update.amountInHostCurrency = tr.amount;
    }
  } else {
    try {
      newFxRate = await getFxRate(tr.currency, tr.hostCurrency, tr.createdAt);
      // if there wasn't any fxrate before, we record it
      if (!tr.hostCurrencyFxRate || tr.hostCurrencyFxRate === 1) {
        reasons.push('no hostCurrencyFxRate');
        update.hostCurrencyFxRate = newFxRate;
      } else if (relativeDiffInPercentage(tr.hostCurrencyFxRate, newFxRate) < 0.1) {
        // if tr.hostCurrencyFxRate is ~= newFxRate, no need to change it, but we need to verify that tr.amountInHostCurrency was correctly computed
        const amountInHostCurrency = Math.round(tr.amount * tr.hostCurrencyFxRate);
        if (tr.amountInHostCurrency != amountInHostCurrency) {
          reasons.push('amountInHostCurrency off');
          update.amountInHostCurrency = amountInHostCurrency;
        }
      } else if (relativeDiffInPercentage(tr.hostCurrencyFxRate, 1 / newFxRate) < 0.1) {
        // if hostCurrencyFxRate ~= 1/newFxRate, then it was in the wrong direction => we flip it
        update.hostCurrencyFxRate = 1 / tr.hostCurrencyFxRate;
        reasons.push('hostCurrencyFxRate flipped');
      } else {
        const diff = relativeDiffInPercentage(tr.hostCurrencyFxRate, Math.abs(tr.amountInHostCurrency / tr.amount));
        // if diff is very small (< 10%)
        if (diff < 0.1) {
          reasons.push(`imprecise fx rate (diff ${diff})`);
          update.hostCurrencyFxRate = Math.abs(tr.amountInHostCurrency / tr.amount);
        } else {
          update.hostCurrencyFxRate = newFxRate;
          reasons.push(`hostCurrencyFxRate off (diff ${diff})`);
        }
      }
    } catch (e) {
      console.error(
        `Unable to fetch fxrate for transaction id ${tr.id} from ${tr.currency} to ${tr.hostCurrency}, date: ${
          tr.createdAt
        }`,
        e,
      );
    }
  }
  const newAmountInHostCurrency = Math.round(tr.amount * update.hostCurrencyFxRate);
  if (update.hostCurrencyFxRate && newAmountInHostCurrency !== tr.amountInHostCurrency) {
    update.amountInHostCurrency = newAmountInHostCurrency;
    // if we change the amountInHostCurrency, we need to recompute the hostFees and platformFees since they were computed based on that amount.
    if (
      tr.platformFeeInHostCurrency < 0 &&
      tr.platformFeeInHostCurrency !== -Math.round(0.05 * Math.abs(update.amountInHostCurrency))
    ) {
      update.platformFeeInHostCurrency = -Math.round(0.05 * Math.abs(update.amountInHostCurrency));
    }
    const hostFeePercent = Math.abs(Math.round((tr.hostFeeInHostCurrency / tr.amountInHostCurrency) * 100) / 100);
    if (
      tr.hostFeeInHostCurrency < 0 &&
      tr.hostFeeInHostCurrency !== -Math.abs(Math.round(hostFeePercent * update.amountInHostCurrency))
    ) {
      update.hostFeeInHostCurrency = -Math.abs(Math.round(hostFeePercent * update.amountInHostCurrency));
    }
  }

  const newTransaction = {
    ...tr,
    ...update,
  };

  const totalFeesInCollectiveCurrency = Math.round(
    (newTransaction.hostFeeInHostCurrency +
      newTransaction.platformFeeInHostCurrency +
      newTransaction.paymentProcessorFeeInHostCurrency || 0) / newTransaction.hostCurrencyFxRate,
  );
  const diff = Math.abs(
    totalFeesInCollectiveCurrency + newTransaction.amount - newTransaction.netAmountInCollectiveCurrency,
  );
  if (diff > 0) {
    reasons.push(`amount + fees != netAmount; diff: ${diff}`);
  }

  newTransaction.hostCollectiveCurrency = newTransaction.hostCurrency; // make sure verify doesn't fail because hostCollective.currency is not set
  const fixValid = verifyTransaction(newTransaction, 0.01);
  if (fixValid) {
    transactionsFixed++;
  }
  if (
    relativeDiffInPercentage(tr.amountInHostCurrency, update.amountInHostCurrency) > 0.1 ||
    Math.abs(tr.amountInHostCurrency - update.amountInHostCurrency) > 500
  ) {
    warnings++;
    console.error(
      `warning: tr ${tr.id} amountInHostCurrency is changing from ${tr.amountInHostCurrency} to ${
        update.amountInHostCurrency
      }`,
    );
  }
  if (
    relativeDiffInPercentage(tr.netAmountInCollectiveCurrency, update.netAmountInCollectiveCurrency) > 0.1 ||
    Math.abs(tr.netAmountInCollectiveCurrency - update.netAmountInCollectiveCurrency) > 500
  ) {
    warnings++;
    console.error(
      `warning: tr ${tr.id} netAmountInCollectiveCurrency is changing from ${tr.netAmountInCollectiveCurrency} to ${
        update.netAmountInCollectiveCurrency
      }`,
    );
  }
  if (tr.hostCurrencyFxRate !== 1 && relativeDiffInPercentage(tr.hostCurrencyFxRate, update.hostCurrencyFxRate) > 0.1) {
    warnings++;
    console.error(
      `warning: tr ${tr.id} hostCurrencyFxRate is changing from ${tr.hostCurrencyFxRate} to ${
        update.hostCurrencyFxRate
      }`,
    );
  }
  const netAmountDelta =
    update.netAmountInCollectiveCurrency &&
    Math.abs(tr.netAmountInCollectiveCurrency - update.netAmountInCollectiveCurrency);
  const amountInHostCurrencyDelta =
    update.amountInHostCurrency && Math.abs(tr.amountInHostCurrency - update.amountInHostCurrency);
  if (DRY_MODE) {
    const vals = [
      moment(tr.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      tr.host,
      tr.hostCollectiveCurrency,
      tr.collective,
      tr.type,
      tr.amount,
      tr.currency,
      tr.amountInHostCurrency,
      update.amountInHostCurrency,
      amountInHostCurrencyDelta,
      tr.hostCurrency,
      tr.hostCurrencyFxRate,
      update.hostCurrencyFxRate,
      tr.hostFeeInHostCurrency,
      tr.platformFeeInHostCurrency,
      tr.paymentProcessorFeeInHostCurrency,
      totalFeesInCollectiveCurrency,
      tr.netAmountInCollectiveCurrency,
      update.netAmountInCollectiveCurrency,
      netAmountDelta,
      tr.OrderId,
      tr.ExpenseId,
      tr.TransactionGroup,
      reasons.join(', '),
      JSON.stringify(update),
      fixValid,
    ];
    console.log(vals.join('|'));
  } else {
    return updateLedgerEntry(tr, update);
  }
};

module.exports = {
  up: (queryInterface, sequelize) => {
    // We need to remove the index on UUID. It should be unique per deletedAt (only one unique UUID that has not been removed)
    // otherwise, we can't delete current transaction row to create a new updated one with the same UUID
    return (
      queryInterface
        .removeIndex('Transactions', 'transactions_uuid')
        .then(() =>
          queryInterface.addIndex('Transactions', ['uuid', 'deletedAt'], {
            indexName: 'transactions_uuid',
            indicesType: 'UNIQUE',
          }),
        )
        // fix transactions where currency != hostCurrency
        .then(() =>
          queryInterface.sequelize.query(
            `
      SELECT t.*, hc.slug as "host", hc.currency as "hostCollectiveCurrency", c.slug as "collective" FROM "Transactions" t
      LEFT JOIN "Collectives" c ON c.id = t."CollectiveId"
      LEFT JOIN "Collectives" hc ON hc.id = t."HostCollectiveId"
      WHERE t."deletedAt" IS NULL
    `,
            { type: sequelize.QueryTypes.SELECT },
          ),
        )
        .map(fixTransaction)
        .then(() => {
          console.log('>>>', transactionsProcessed, 'transactions processed');
          console.log(
            `>>> ${invalidTransactions} invalid transactions (${Math.round(
              (invalidTransactions / transactionsProcessed) * 10000,
            ) / 100}%)`,
          );
          console.log(
            `>>> Updating ${transactionsUpdated} transactions (${Math.round(
              (transactionsUpdated / invalidTransactions) * 10000,
            ) / 100}%)`,
          );
          console.log(
            `>>> Fixing ${transactionsFixed} transactions (${Math.round(
              (transactionsFixed / invalidTransactions) * 10000,
            ) / 100}%)`,
          );
          console.log('>>>', warnings, 'warnings');
          if (Object.keys(errorsObject).length > 0) {
            for (let key in errorsObject) {
              console.error(errorsObject[key]);
            }
          }
          if (DRY_MODE) {
            queries.map(q => console.log('> query:', q.query, 'replacements:', JSON.stringify(q.replacements)));
            throw new Error('Success!');
          } else {
            console.log('>>> running', queries.length, 'queries');
            return Promise.map(
              queries,
              query =>
                queryInterface.sequelize.query(query.query, { replacements: query.replacements }).catch(e => {
                  failedUpdates++;
                  console.log('>>> error: ', JSON.stringify(e, null, '  '));
                }),
              { concurrency: 2 },
            );
          }
        })
        .then(() => {
          console.log(`>>> ${failedUpdates} queries returned an error`);
        })
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); // No way to revert this
  },
};

/**
 * We mock external calls to make sure we don't need depend on the network to perform this migration
 */
const initNock = () => {
  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'INR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'INR',
      date: '2016-12-27',
      rates: { USD: 0.014713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-28')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522281599,
      historical: true,
      base: 'EUR',
      date: '2018-03-28',
      rates: { USD: 1.23148 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-23')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471996799,
      historical: true,
      base: 'USD',
      date: '2016-08-23',
      rates: { UYU: 28.479966 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-04')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457135999,
      historical: true,
      base: 'AUD',
      date: '2016-03-04',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-28')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522281599,
      historical: true,
      base: 'GBP',
      date: '2018-03-28',
      rates: { USD: 1.408034 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1531007999,
      historical: true,
      base: 'USD',
      date: '2018-07-07',
      rates: { GBP: 0.75252 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'CAD',
      date: '2018-03-27',
      rates: { USD: 0.776459 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-18')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513641599,
      historical: true,
      base: 'GBP',
      date: '2017-12-18',
      rates: { USD: 1.337954 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-28')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522281599,
      historical: true,
      base: 'GBP',
      date: '2018-03-28',
      rates: { USD: 1.408034 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'AUD',
      date: '2018-03-17',
      rates: { USD: 0.77196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'AUD',
      date: '2018-03-17',
      rates: { USD: 0.77196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1531007999,
      historical: true,
      base: 'USD',
      date: '2018-07-07',
      rates: { EUR: 0.850404 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-26')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456531199,
      historical: true,
      base: 'AUD',
      date: '2016-02-26',
      rates: { USD: 0.712692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'CAD',
      date: '2018-03-17',
      rates: { USD: 0.763823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'CAD',
      date: '2018-03-17',
      rates: { USD: 0.763823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'EUR',
      date: '2016-12-27',
      rates: { USD: 1.046353 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-15')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1505519999,
      historical: true,
      base: 'CAD',
      date: '2017-09-15',
      rates: { USD: 0.820544 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'GBP',
      date: '2016-12-07',
      rates: { USD: 1.262802 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-21')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521676799,
      historical: true,
      base: 'EUR',
      date: '2018-03-21',
      rates: { USD: 1.23518 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-21')
    .query({ access_key: /.*/i, base: 'INR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498089599,
      historical: true,
      base: 'INR',
      date: '2017-06-21',
      rates: { USD: 0.015497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-31')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'AUD' })
    .reply(200, {
      success: true,
      timestamp: 1509494399,
      historical: true,
      base: 'USD',
      date: '2017-10-31',
      rates: { AUD: 1.305497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1510358399,
      historical: true,
      base: 'MXN',
      date: '2017-11-10',
      rates: { USD: 0.052346 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'EUR',
      date: '2016-12-07',
      rates: { USD: 1.076194 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'MXN',
      date: '2018-03-27',
      rates: { USD: 0.054425 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1513295999,
      historical: true,
      base: 'USD',
      date: '2017-12-14',
      rates: { GBP: 0.74444 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'CAD',
      date: '2018-03-17',
      rates: { USD: 0.763823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-31')
    .times(2)
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504223999,
      historical: true,
      base: 'GBP',
      date: '2017-08-31',
      rates: { USD: 1.293878 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-31')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504223999,
      historical: true,
      base: 'AUD',
      date: '2017-08-31',
      rates: { USD: 0.794222 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-03')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1478217599,
      historical: true,
      base: 'USD',
      date: '2016-11-03',
      rates: { UYU: 28.219999 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-26')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456531199,
      historical: true,
      base: 'AUD',
      date: '2016-02-26',
      rates: { USD: 0.712692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { NZD: 1.451104 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517270399,
      historical: true,
      base: 'CAD',
      date: '2018-01-29',
      rates: { USD: 0.810669 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512604799,
      historical: true,
      base: 'GBP',
      date: '2017-12-06',
      rates: { USD: 1.339172 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'AUD',
      date: '2016-12-27',
      rates: { USD: 0.719114 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-29')
    .times(2)
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1480463999,
      historical: true,
      base: 'MXN',
      date: '2016-11-29',
      rates: { USD: 0.04849 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-29')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1480463999,
      historical: true,
      base: 'EUR',
      date: '2016-11-29',
      rates: { USD: 1.064994 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-29')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1480463999,
      historical: true,
      base: 'MXN',
      date: '2016-11-29',
      rates: { USD: 0.04849 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'JPY', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'JPY',
      date: '2016-12-28',
      rates: { USD: 0.008542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-29')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1480463999,
      historical: true,
      base: 'GBP',
      date: '2016-11-29',
      rates: { USD: 1.248985 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-08')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457481599,
      historical: true,
      base: 'AUD',
      date: '2016-03-08',
      rates: { USD: 0.743165 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467676799,
      historical: true,
      base: 'USD',
      date: '2016-07-04',
      rates: { UYU: 30.54732 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-25')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506383999,
      historical: true,
      base: 'CAD',
      date: '2017-09-25',
      rates: { USD: 0.808486 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1455148799,
      historical: true,
      base: 'MXN',
      date: '2016-02-10',
      rates: { USD: 0.052942 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'GBP',
      date: '2017-03-31',
      rates: { USD: 1.2545 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1503532799,
      historical: true,
      base: 'CAD',
      date: '2017-08-23',
      rates: { USD: 0.797251 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'CAD',
      date: '2018-05-09',
      rates: { USD: 0.778234 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-04')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525478399,
      historical: true,
      base: 'CAD',
      date: '2018-05-04',
      rates: { USD: 0.778692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'GBP',
      date: '2018-05-03',
      rates: { USD: 1.357091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488931199,
      historical: true,
      base: 'MXN',
      date: '2017-03-07',
      rates: { USD: 0.051336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467417599,
      historical: true,
      base: 'USD',
      date: '2016-07-01',
      rates: { UYU: 30.55184 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-14')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1489535999,
      historical: true,
      base: 'MXN',
      date: '2017-03-14',
      rates: { USD: 0.050883 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'AUD',
      date: '2018-03-17',
      rates: { USD: 0.77196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496879999,
      historical: true,
      base: 'AUD',
      date: '2017-06-07',
      rates: { USD: 0.754175 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1530316799,
      historical: true,
      base: 'CAD',
      date: '2018-06-29',
      rates: { USD: 0.761264 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-19')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521503999,
      historical: true,
      base: 'GBP',
      date: '2018-03-19',
      rates: { USD: 1.402426 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1523145599,
      historical: true,
      base: 'USD',
      date: '2018-04-07',
      rates: { GBP: 0.70971 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-23')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458777599,
      historical: true,
      base: 'AUD',
      date: '2016-03-23',
      rates: { USD: 0.753238 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-04')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504569599,
      historical: true,
      base: 'EUR',
      date: '2017-09-04',
      rates: { USD: 1.189908 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508457599,
      historical: true,
      base: 'MXN',
      date: '2017-10-19',
      rates: { USD: 0.053158 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'EUR',
      date: '2018-05-15',
      rates: { USD: 1.182595 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-09-30')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1475279999,
      historical: true,
      base: 'EUR',
      date: '2016-09-30',
      rates: { USD: 1.124475 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'GBP',
      date: '2018-01-08',
      rates: { USD: 1.357092 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498867199,
      historical: true,
      base: 'USD',
      date: '2017-06-30',
      rates: { NZD: 1.363604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-06')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457308799,
      historical: true,
      base: 'AUD',
      date: '2016-03-06',
      rates: { USD: 0.741597 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-01')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1478044799,
      historical: true,
      base: 'EUR',
      date: '2016-11-01',
      rates: { USD: 1.105945 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-27')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1459123199,
      historical: true,
      base: 'AUD',
      date: '2016-03-27',
      rates: { USD: 0.750823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-23')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471996799,
      historical: true,
      base: 'USD',
      date: '2016-08-23',
      rates: { UYU: 28.479966 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510963199,
      historical: true,
      base: 'USD',
      date: '2017-11-17',
      rates: { GBP: 0.75677 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-09-27')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1475020799,
      historical: true,
      base: 'USD',
      date: '2016-09-27',
      rates: { UYU: 28.379999 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-22')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521763199,
      historical: true,
      base: 'MXN',
      date: '2018-03-22',
      rates: { USD: 0.053542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513641599,
      historical: true,
      base: 'CAD',
      date: '2017-12-18',
      rates: { USD: 0.777273 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-21')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498089599,
      historical: true,
      base: 'GBP',
      date: '2017-06-21',
      rates: { USD: 1.267539 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-21')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498089599,
      historical: true,
      base: 'MXN',
      date: '2017-06-21',
      rates: { USD: 0.054845 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510963199,
      historical: true,
      base: 'USD',
      date: '2017-11-17',
      rates: { GBP: 0.75677 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508457599,
      historical: true,
      base: 'MXN',
      date: '2017-10-19',
      rates: { USD: 0.053158 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488931199,
      historical: true,
      base: 'MXN',
      date: '2017-03-07',
      rates: { USD: 0.051336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-21')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513900799,
      historical: true,
      base: 'GBP',
      date: '2017-12-21',
      rates: { USD: 1.338007 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523404799,
      historical: true,
      base: 'CAD',
      date: '2018-04-10',
      rates: { USD: 0.794054 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496879999,
      historical: true,
      base: 'AUD',
      date: '2017-06-07',
      rates: { USD: 0.754175 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-09')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457567999,
      historical: true,
      base: 'AUD',
      date: '2016-03-09',
      rates: { USD: 0.747676 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'MXN',
      date: '2018-03-27',
      rates: { USD: 0.054425 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1524787199,
      historical: true,
      base: 'USD',
      date: '2018-04-26',
      rates: { GBP: 0.71845 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'MXN',
      date: '2018-04-19',
      rates: { USD: 0.054211 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513641599,
      historical: true,
      base: 'CAD',
      date: '2017-12-18',
      rates: { USD: 0.777273 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-05')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1454716799,
      historical: true,
      base: 'AUD',
      date: '2016-02-05',
      rates: { USD: 0.706729 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-14')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523750399,
      historical: true,
      base: 'GBP',
      date: '2018-04-14',
      rates: { USD: 1.423527 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-14')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457999999,
      historical: true,
      base: 'AUD',
      date: '2016-03-14',
      rates: { USD: 0.750984 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456099199,
      historical: true,
      base: 'AUD',
      date: '2016-02-21',
      rates: { USD: 0.714532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'GBP',
      date: '2016-12-27',
      rates: { USD: 1.227567 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1510358399,
      historical: true,
      base: 'MXN',
      date: '2017-11-10',
      rates: { USD: 0.052346 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-16')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1489708799,
      historical: true,
      base: 'USD',
      date: '2017-03-16',
      rates: { UYU: 28.200001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1506902399,
      historical: true,
      base: 'USD',
      date: '2017-10-01',
      rates: { NZD: 1.3848 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'EUR',
      date: '2018-05-15',
      rates: { USD: 1.182595 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'AUD',
      date: '2016-12-27',
      rates: { USD: 0.719114 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-04-20')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1461196799,
      historical: true,
      base: 'EUR',
      date: '2016-04-20',
      rates: { USD: 1.130046 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'EUR',
      date: '2016-12-27',
      rates: { USD: 1.046353 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-03')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457049599,
      historical: true,
      base: 'AUD',
      date: '2016-03-03',
      rates: { USD: 0.735069 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { NZD: 1.387991 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-18')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492559999,
      historical: true,
      base: 'GBP',
      date: '2017-04-18',
      rates: { USD: 1.284538 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'GBP',
      date: '2017-09-08',
      rates: { USD: 1.31987 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-25')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1503705599,
      historical: true,
      base: 'USD',
      date: '2017-08-25',
      rates: { EUR: 0.838204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'EUR',
      date: '2018-01-07',
      rates: { USD: 1.204091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496879999,
      historical: true,
      base: 'AUD',
      date: '2017-06-07',
      rates: { USD: 0.754175 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-09')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457567999,
      historical: true,
      base: 'AUD',
      date: '2016-03-09',
      rates: { USD: 0.747676 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'EUR',
      date: '2018-03-27',
      rates: { USD: 1.241307 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'CAD',
      date: '2016-12-28',
      rates: { USD: 0.737915 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1504310399,
      historical: true,
      base: 'USD',
      date: '2017-09-01',
      rates: { NZD: 1.396904 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-02')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456963199,
      historical: true,
      base: 'MXN',
      date: '2016-03-02',
      rates: { USD: 0.055944 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-25')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1503705599,
      historical: true,
      base: 'USD',
      date: '2017-08-25',
      rates: { EUR: 0.838204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'GBP',
      date: '2018-05-15',
      rates: { USD: 1.349747 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-15')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1471305599,
      historical: true,
      base: 'MXN',
      date: '2016-08-15',
      rates: { USD: 0.055326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467676799,
      historical: true,
      base: 'USD',
      date: '2016-07-04',
      rates: { UYU: 30.54732 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-15')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458086399,
      historical: true,
      base: 'AUD',
      date: '2016-03-15',
      rates: { USD: 0.746235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-01-24')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1485302399,
      historical: true,
      base: 'USD',
      date: '2017-01-24',
      rates: { UYU: 28.250188 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-23')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458777599,
      historical: true,
      base: 'AUD',
      date: '2016-03-23',
      rates: { USD: 0.753238 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471478399,
      historical: true,
      base: 'USD',
      date: '2016-08-17',
      rates: { UYU: 28.580173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498953599,
      historical: true,
      base: 'USD',
      date: '2017-07-01',
      rates: { NZD: 1.363604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { NZD: 1.429095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456099199,
      historical: true,
      base: 'AUD',
      date: '2016-02-21',
      rates: { USD: 0.714532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526601599,
      historical: true,
      base: 'CAD',
      date: '2018-05-17',
      rates: { USD: 0.779077 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'GBP',
      date: '2016-12-27',
      rates: { USD: 1.227567 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467676799,
      historical: true,
      base: 'USD',
      date: '2016-07-04',
      rates: { UYU: 30.54732 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-22')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521763199,
      historical: true,
      base: 'MXN',
      date: '2018-03-22',
      rates: { USD: 0.053542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-18')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471564799,
      historical: true,
      base: 'USD',
      date: '2016-08-18',
      rates: { UYU: 28.540001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-27')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1490659199,
      historical: true,
      base: 'GBP',
      date: '2017-03-27',
      rates: { USD: 1.255793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510703999,
      historical: true,
      base: 'USD',
      date: '2017-11-14',
      rates: { GBP: 0.76001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'EUR',
      date: '2018-03-27',
      rates: { USD: 1.241307 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-15')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458086399,
      historical: true,
      base: 'AUD',
      date: '2016-03-15',
      rates: { USD: 0.746235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-03')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1478217599,
      historical: true,
      base: 'USD',
      date: '2016-11-03',
      rates: { UYU: 28.219999 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471478399,
      historical: true,
      base: 'USD',
      date: '2016-08-17',
      rates: { UYU: 28.580173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'MXN',
      date: '2018-04-19',
      rates: { USD: 0.054211 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1531007999,
      historical: true,
      base: 'USD',
      date: '2018-07-07',
      rates: { EUR: 0.850404 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467331199,
      historical: true,
      base: 'USD',
      date: '2016-06-30',
      rates: { UYU: 30.74139 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528502399,
      historical: true,
      base: 'CAD',
      date: '2018-06-08',
      rates: { USD: 0.773931 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { EUR: 0.855897 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522108799,
      historical: true,
      base: 'USD',
      date: '2018-03-26',
      rates: { GBP: 0.70233 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510963199,
      historical: true,
      base: 'USD',
      date: '2017-11-17',
      rates: { GBP: 0.75677 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-05-16')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1463443199,
      historical: true,
      base: 'MXN',
      date: '2016-05-16',
      rates: { USD: 0.054796 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1524787199,
      historical: true,
      base: 'USD',
      date: '2018-04-26',
      rates: { GBP: 0.71845 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506556799,
      historical: true,
      base: 'EUR',
      date: '2017-09-27',
      rates: { USD: 1.175231 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1455148799,
      historical: true,
      base: 'MXN',
      date: '2016-02-10',
      rates: { USD: 0.052942 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-27')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1490659199,
      historical: true,
      base: 'GBP',
      date: '2017-03-27',
      rates: { USD: 1.255793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-26')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506470399,
      historical: true,
      base: 'CAD',
      date: '2017-09-26',
      rates: { USD: 0.808793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { EUR: 0.857204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496793599,
      historical: true,
      base: 'EUR',
      date: '2017-06-06',
      rates: { USD: 1.127362 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-02')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456963199,
      historical: true,
      base: 'MXN',
      date: '2016-03-02',
      rates: { USD: 0.055944 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-23')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471996799,
      historical: true,
      base: 'USD',
      date: '2016-08-23',
      rates: { UYU: 28.479966 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-05')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496707199,
      historical: true,
      base: 'GBP',
      date: '2017-06-05',
      rates: { USD: 1.290606 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { EUR: 0.813199 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'EUR',
      date: '2016-12-27',
      rates: { USD: 1.046353 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1530316799,
      historical: true,
      base: 'CAD',
      date: '2018-06-29',
      rates: { USD: 0.761264 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-21')
    .query({ access_key: /.*/i, base: 'INR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498089599,
      historical: true,
      base: 'INR',
      date: '2017-06-21',
      rates: { USD: 0.015497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'AUD',
      date: '2016-12-23',
      rates: { USD: 0.718182 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-18')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471564799,
      historical: true,
      base: 'USD',
      date: '2016-08-18',
      rates: { UYU: 28.540001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467417599,
      historical: true,
      base: 'USD',
      date: '2016-07-01',
      rates: { UYU: 30.55184 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-21')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1506038399,
      historical: true,
      base: 'USD',
      date: '2017-09-21',
      rates: { EUR: 0.836803 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1509839999,
      historical: true,
      base: 'USD',
      date: '2017-11-04',
      rates: { NZD: 1.447304 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-04')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525478399,
      historical: true,
      base: 'EUR',
      date: '2018-05-04',
      rates: { USD: 1.196596 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'CAD',
      date: '2016-12-28',
      rates: { USD: 0.737915 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'USD',
      date: '2017-09-08',
      rates: { EUR: 0.830604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-05')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457222399,
      historical: true,
      base: 'AUD',
      date: '2016-03-05',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'GBP',
      date: '2018-04-19',
      rates: { USD: 1.40853 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1515542399,
      historical: true,
      base: 'USD',
      date: '2018-01-09',
      rates: { NZD: 1.399402 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'USD',
      date: '2017-09-08',
      rates: { EUR: 0.830604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1501804799,
      historical: true,
      base: 'GBP',
      date: '2017-08-03',
      rates: { USD: 1.314441 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'EUR',
      date: '2018-05-15',
      rates: { USD: 1.182595 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'AUD',
      date: '2016-12-28',
      rates: { USD: 0.718495 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522108799,
      historical: true,
      base: 'USD',
      date: '2018-03-26',
      rates: { GBP: 0.70233 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-09')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1497052799,
      historical: true,
      base: 'EUR',
      date: '2017-06-09',
      rates: { USD: 1.11969 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-21')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521676799,
      historical: true,
      base: 'EUR',
      date: '2018-03-21',
      rates: { USD: 1.23518 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-22')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521763199,
      historical: true,
      base: 'MXN',
      date: '2018-03-22',
      rates: { USD: 0.053542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'USD',
      date: '2018-05-07',
      rates: { GBP: 0.73713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518047999,
      historical: true,
      base: 'USD',
      date: '2018-02-07',
      rates: { GBP: 0.72059 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-24')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527206399,
      historical: true,
      base: 'USD',
      date: '2018-05-24',
      rates: { GBP: 0.74722 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518047999,
      historical: true,
      base: 'USD',
      date: '2018-02-07',
      rates: { GBP: 0.72059 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'CAD',
      date: '2017-03-31',
      rates: { USD: 0.750861 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467331199,
      historical: true,
      base: 'USD',
      date: '2016-06-30',
      rates: { UYU: 30.74139 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-04-20')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1461196799,
      historical: true,
      base: 'EUR',
      date: '2016-04-20',
      rates: { USD: 1.130046 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'CAD',
      date: '2018-03-17',
      rates: { USD: 0.763823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-21')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1506038399,
      historical: true,
      base: 'USD',
      date: '2017-09-21',
      rates: { EUR: 0.836803 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525996799,
      historical: true,
      base: 'CAD',
      date: '2018-05-10',
      rates: { USD: 0.782987 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-14')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1489535999,
      historical: true,
      base: 'MXN',
      date: '2017-03-14',
      rates: { USD: 0.050883 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-20')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458518399,
      historical: true,
      base: 'AUD',
      date: '2016-03-20',
      rates: { USD: 0.759753 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'CAD',
      date: '2018-01-08',
      rates: { USD: 0.805484 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-02-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488326399,
      historical: true,
      base: 'CAD',
      date: '2017-02-28',
      rates: { USD: 0.751106 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-05-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1494460799,
      historical: true,
      base: 'CAD',
      date: '2017-05-10',
      rates: { USD: 0.729343 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'USD',
      date: '2017-09-08',
      rates: { EUR: 0.830604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { EUR: 0.855897 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'EUR',
      date: '2018-05-09',
      rates: { USD: 1.18497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1510358399,
      historical: true,
      base: 'MXN',
      date: '2017-11-10',
      rates: { USD: 0.052346 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1506902399,
      historical: true,
      base: 'USD',
      date: '2017-10-01',
      rates: { NZD: 1.3848 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'MXN',
      date: '2018-05-03',
      rates: { USD: 0.052488 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-12')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523577599,
      historical: true,
      base: 'GBP',
      date: '2018-04-12',
      rates: { USD: 1.423812 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1528415999,
      historical: true,
      base: 'USD',
      date: '2018-06-07',
      rates: { GBP: 0.74529 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508284799,
      historical: true,
      base: 'EUR',
      date: '2017-10-17',
      rates: { USD: 1.177446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471478399,
      historical: true,
      base: 'USD',
      date: '2016-08-17',
      rates: { UYU: 28.580173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'CAD',
      date: '2018-04-19',
      rates: { USD: 0.789571 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'CAD',
      date: '2018-01-08',
      rates: { USD: 0.805484 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { NZD: 1.429095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { NZD: 1.387991 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1531007999,
      historical: true,
      base: 'USD',
      date: '2018-07-07',
      rates: { GBP: 0.75252 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-01-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1484351999,
      historical: true,
      base: 'USD',
      date: '2017-01-13',
      rates: { UYU: 28.660367 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-05')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457222399,
      historical: true,
      base: 'AUD',
      date: '2016-03-05',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { EUR: 0.813199 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'EUR',
      date: '2018-04-19',
      rates: { USD: 1.234875 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-03')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457049599,
      historical: true,
      base: 'AUD',
      date: '2016-03-03',
      rates: { USD: 0.735069 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'MXN',
      date: '2018-05-03',
      rates: { USD: 0.052488 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'USD',
      date: '2018-05-18',
      rates: { EUR: 0.849404 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-25')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1503705599,
      historical: true,
      base: 'USD',
      date: '2017-08-25',
      rates: { EUR: 0.838204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'EUR',
      date: '2016-12-27',
      rates: { USD: 1.046353 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530748799,
      historical: true,
      base: 'USD',
      date: '2018-07-04',
      rates: { GBP: 0.75582 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'GBP',
      date: '2017-03-31',
      rates: { USD: 1.2545 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-14')
    .times(2)
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1500076799,
      historical: true,
      base: 'CAD',
      date: '2017-07-14',
      rates: { USD: 0.791074 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'GBP',
      date: '2017-09-08',
      rates: { USD: 1.31987 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1509839999,
      historical: true,
      base: 'USD',
      date: '2017-11-04',
      rates: { NZD: 1.447304 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'EUR',
      date: '2018-05-15',
      rates: { USD: 1.182595 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1523318399,
      historical: true,
      base: 'USD',
      date: '2018-04-09',
      rates: { NZD: 1.367702 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-12')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1520899199,
      historical: true,
      base: 'GBP',
      date: '2018-03-12',
      rates: { USD: 1.390588 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-04')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457135999,
      historical: true,
      base: 'AUD',
      date: '2016-03-04',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518566399,
      historical: true,
      base: 'USD',
      date: '2018-02-13',
      rates: { GBP: 0.72021 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1501631999,
      historical: true,
      base: 'USD',
      date: '2017-08-01',
      rates: { NZD: 1.346204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'USD',
      date: '2018-01-08',
      rates: { GBP: 0.73687 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-03')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457049599,
      historical: true,
      base: 'AUD',
      date: '2016-03-03',
      rates: { USD: 0.735069 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'USD',
      date: '2018-05-18',
      rates: { EUR: 0.849404 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'GBP',
      date: '2018-01-07',
      rates: { USD: 1.357682 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467331199,
      historical: true,
      base: 'USD',
      date: '2016-06-30',
      rates: { UYU: 30.74139 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-26')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506470399,
      historical: true,
      base: 'CAD',
      date: '2017-09-26',
      rates: { USD: 0.808793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498953599,
      historical: true,
      base: 'USD',
      date: '2017-07-01',
      rates: { NZD: 1.363604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-04')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457135999,
      historical: true,
      base: 'AUD',
      date: '2016-03-04',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'EUR',
      date: '2018-03-27',
      rates: { USD: 1.241307 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-09')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457567999,
      historical: true,
      base: 'AUD',
      date: '2016-03-09',
      rates: { USD: 0.747676 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508371199,
      historical: true,
      base: 'CAD',
      date: '2017-10-18',
      rates: { USD: 0.802244 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-28')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498694399,
      historical: true,
      base: 'USD',
      date: '2017-06-28',
      rates: { NZD: 1.368601 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1513295999,
      historical: true,
      base: 'USD',
      date: '2017-12-14',
      rates: { GBP: 0.74444 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { NZD: 1.351298 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'AUD',
      date: '2016-12-28',
      rates: { USD: 0.718495 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1515974399,
      historical: true,
      base: 'USD',
      date: '2018-01-14',
      rates: { GBP: 0.728149 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-06')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1528329599,
      historical: true,
      base: 'USD',
      date: '2018-06-06',
      rates: { EUR: 0.848498 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'CAD',
      date: '2018-01-08',
      rates: { USD: 0.805484 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-11')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1531353599,
      historical: true,
      base: 'USD',
      date: '2018-07-11',
      rates: { GBP: 0.75713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'USD',
      date: '2018-05-07',
      rates: { GBP: 0.73713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-26')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506470399,
      historical: true,
      base: 'CAD',
      date: '2017-09-26',
      rates: { USD: 0.808793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1511999999,
      historical: true,
      base: 'CAD',
      date: '2017-11-29',
      rates: { USD: 0.777357 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'CAD',
      date: '2018-03-27',
      rates: { USD: 0.776459 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-24')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524614399,
      historical: true,
      base: 'CAD',
      date: '2018-04-24',
      rates: { USD: 0.779952 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { NZD: 1.381604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'GBP',
      date: '2016-12-23',
      rates: { USD: 1.228531 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'CAD',
      date: '2018-05-09',
      rates: { USD: 0.778234 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458259199,
      historical: true,
      base: 'AUD',
      date: '2016-03-17',
      rates: { USD: 0.764229 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-05')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528243199,
      historical: true,
      base: 'CAD',
      date: '2018-06-05',
      rates: { USD: 0.772929 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { EUR: 0.813199 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'EUR',
      date: '2018-05-03',
      rates: { USD: 1.199326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523404799,
      historical: true,
      base: 'CAD',
      date: '2018-04-10',
      rates: { USD: 0.794054 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-23')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1503532799,
      historical: true,
      base: 'GBP',
      date: '2017-08-23',
      rates: { USD: 1.280312 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-19')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513727999,
      historical: true,
      base: 'CAD',
      date: '2017-12-19',
      rates: { USD: 0.77647 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1511740799,
      historical: true,
      base: 'USD',
      date: '2017-11-26',
      rates: { GBP: 0.750495 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'CAD',
      date: '2017-03-31',
      rates: { USD: 0.750861 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515715199,
      historical: true,
      base: 'CAD',
      date: '2018-01-11',
      rates: { USD: 0.798601 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-31')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1509494399,
      historical: true,
      base: 'CAD',
      date: '2017-10-31',
      rates: { USD: 0.775699 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { EUR: 0.857204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-26')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456531199,
      historical: true,
      base: 'AUD',
      date: '2016-02-26',
      rates: { USD: 0.712692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-31')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'AUD' })
    .reply(200, {
      success: true,
      timestamp: 1509494399,
      historical: true,
      base: 'USD',
      date: '2017-10-31',
      rates: { AUD: 1.305497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-05')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528243199,
      historical: true,
      base: 'CAD',
      date: '2018-06-05',
      rates: { USD: 0.772929 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'EUR',
      date: '2016-12-07',
      rates: { USD: 1.076194 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1523145599,
      historical: true,
      base: 'USD',
      date: '2018-04-07',
      rates: { GBP: 0.70971 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-09')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1497052799,
      historical: true,
      base: 'EUR',
      date: '2017-06-09',
      rates: { USD: 1.11969 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'GBP',
      date: '2018-05-03',
      rates: { USD: 1.357091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-14')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523750399,
      historical: true,
      base: 'GBP',
      date: '2018-04-14',
      rates: { USD: 1.423527 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'AUD',
      date: '2016-12-23',
      rates: { USD: 0.718182 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'CAD',
      date: '2018-05-15',
      rates: { USD: 0.776892 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-15')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458086399,
      historical: true,
      base: 'AUD',
      date: '2016-03-15',
      rates: { USD: 0.746235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { NZD: 1.431904 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-08')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457481599,
      historical: true,
      base: 'AUD',
      date: '2016-03-08',
      rates: { USD: 0.743165 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-11')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1531353599,
      historical: true,
      base: 'USD',
      date: '2018-07-11',
      rates: { GBP: 0.75713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'USD',
      date: '2018-05-08',
      rates: { GBP: 0.73779 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-05')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530835199,
      historical: true,
      base: 'USD',
      date: '2018-07-05',
      rates: { GBP: 0.75632 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-01-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1484351999,
      historical: true,
      base: 'USD',
      date: '2017-01-13',
      rates: { UYU: 28.660367 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1530575999,
      historical: true,
      base: 'USD',
      date: '2018-07-02',
      rates: { NZD: 1.489798 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-21')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521676799,
      historical: true,
      base: 'CAD',
      date: '2018-03-21',
      rates: { USD: 0.775398 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-02')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1496447999,
      historical: true,
      base: 'EUR',
      date: '2017-06-02',
      rates: { USD: 1.128154 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-29')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1480463999,
      historical: true,
      base: 'EUR',
      date: '2016-11-29',
      rates: { USD: 1.064994 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-02')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1501718399,
      historical: true,
      base: 'GBP',
      date: '2017-08-02',
      rates: { USD: 1.322786 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'GBP',
      date: '2018-05-03',
      rates: { USD: 1.357091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1511740799,
      historical: true,
      base: 'USD',
      date: '2017-11-26',
      rates: { GBP: 0.750495 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'GBP',
      date: '2018-01-07',
      rates: { USD: 1.357682 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'JPY', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'JPY',
      date: '2016-12-28',
      rates: { USD: 0.008542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530575999,
      historical: true,
      base: 'USD',
      date: '2018-07-02',
      rates: { GBP: 0.76087 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-02-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488326399,
      historical: true,
      base: 'CAD',
      date: '2017-02-28',
      rates: { USD: 0.751106 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-25')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1503705599,
      historical: true,
      base: 'USD',
      date: '2017-08-25',
      rates: { EUR: 0.838204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-10-21')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1477094399,
      historical: true,
      base: 'USD',
      date: '2016-10-21',
      rates: { UYU: 28.040001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-31')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517443199,
      historical: true,
      base: 'CAD',
      date: '2018-01-31',
      rates: { USD: 0.812742 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-14')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1489535999,
      historical: true,
      base: 'MXN',
      date: '2017-03-14',
      rates: { USD: 0.050883 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1509148799,
      historical: true,
      base: 'EUR',
      date: '2017-10-27',
      rates: { USD: 1.1613 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1510358399,
      historical: true,
      base: 'MXN',
      date: '2017-11-10',
      rates: { USD: 0.052346 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-02')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1514937599,
      historical: true,
      base: 'GBP',
      date: '2018-01-02',
      rates: { USD: 1.35949 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498867199,
      historical: true,
      base: 'USD',
      date: '2017-06-30',
      rates: { NZD: 1.363604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498867199,
      historical: true,
      base: 'CAD',
      date: '2017-06-30',
      rates: { USD: 0.771364 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1498867199,
      historical: true,
      base: 'EUR',
      date: '2017-07-07',
      rates: { USD: 1.140376 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-10-07')
    .times(10)
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1475884799,
      historical: true,
      base: 'GBP',
      date: '2016-10-07',
      rates: { USD: 1.243842 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1530316799,
      historical: true,
      base: 'CAD',
      date: '2018-06-29',
      rates: { USD: 0.761264 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-12')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1523577599,
      historical: true,
      base: 'GBP',
      date: '2018-04-12',
      rates: { USD: 1.423812 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-22')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1519343999,
      historical: true,
      base: 'USD',
      date: '2018-02-22',
      rates: { GBP: 0.71681 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512259199,
      historical: true,
      base: 'CAD',
      date: '2017-12-02',
      rates: { USD: 0.788828 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-09')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457567999,
      historical: true,
      base: 'AUD',
      date: '2016-03-09',
      rates: { USD: 0.747676 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'USD',
      date: '2018-05-07',
      rates: { GBP: 0.73713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'INR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'INR',
      date: '2016-12-27',
      rates: { USD: 0.014713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-09-27')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1475020799,
      historical: true,
      base: 'USD',
      date: '2016-09-27',
      rates: { UYU: 28.379999 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'MXN',
      date: '2018-03-27',
      rates: { USD: 0.054425 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'GBP',
      date: '2018-05-03',
      rates: { USD: 1.357091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1503532799,
      historical: true,
      base: 'CAD',
      date: '2017-08-23',
      rates: { USD: 0.797251 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'GBP',
      date: '2018-05-03',
      rates: { USD: 1.357091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-20')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458518399,
      historical: true,
      base: 'AUD',
      date: '2016-03-20',
      rates: { USD: 0.759753 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-05')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528243199,
      historical: true,
      base: 'CAD',
      date: '2018-06-05',
      rates: { USD: 0.772929 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-14')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1497484799,
      historical: true,
      base: 'GBP',
      date: '2017-06-14',
      rates: { USD: 1.275543 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'GBP',
      date: '2018-05-15',
      rates: { USD: 1.349747 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-20')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508543999,
      historical: true,
      base: 'EUR',
      date: '2017-10-20',
      rates: { USD: 1.178823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-06')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1528329599,
      historical: true,
      base: 'USD',
      date: '2018-06-06',
      rates: { EUR: 0.848498 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1515542399,
      historical: true,
      base: 'USD',
      date: '2018-01-09',
      rates: { NZD: 1.399402 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-05-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1494460799,
      historical: true,
      base: 'CAD',
      date: '2017-05-10',
      rates: { USD: 0.729343 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'MXN',
      date: '2018-04-19',
      rates: { USD: 0.054211 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'EUR',
      date: '2016-12-07',
      rates: { USD: 1.076194 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-03')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522799999,
      historical: true,
      base: 'USD',
      date: '2018-04-03',
      rates: { EUR: 0.814196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .times(10)
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-31')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1509494399,
      historical: true,
      base: 'CAD',
      date: '2017-10-31',
      rates: { USD: 0.775699 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .times(10)
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512604799,
      historical: true,
      base: 'CAD',
      date: '2017-12-06',
      rates: { USD: 0.782038 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504310399,
      historical: true,
      base: 'USD',
      date: '2017-09-01',
      rates: { EUR: 0.84304 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .times(3)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504310399,
      historical: true,
      base: 'EUR',
      date: '2017-09-01',
      rates: { USD: 1.186183 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .times(2)
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.056174 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .times(2)
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'AUD',
      date: '2017-07-10',
      rates: { USD: 0.797955 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { EUR: 0.855897 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { EUR: 0.855897 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525219199,
      historical: true,
      base: 'USD',
      date: '2018-05-01',
      rates: { GBP: 0.73474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'GBP',
      date: '2018-05-07',
      rates: { USD: 1.356613 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1526255999,
      historical: true,
      base: 'USD',
      date: '2018-05-13',
      rates: { GBP: 0.737959 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-02-21')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1487721599,
      historical: true,
      base: 'EUR',
      date: '2017-02-21',
      rates: { USD: 1.05452 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530575999,
      historical: true,
      base: 'USD',
      date: '2018-07-02',
      rates: { GBP: 0.76087 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-11')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1505174399,
      historical: true,
      base: 'USD',
      date: '2017-09-11',
      rates: { EUR: 0.836 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-02')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-11-02',
      rates: { USD: 0.780793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'AUD',
      date: '2018-05-02',
      rates: { USD: 0.748782 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1515974399,
      historical: true,
      base: 'USD',
      date: '2018-01-14',
      rates: { GBP: 0.728149 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-05-16')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1463443199,
      historical: true,
      base: 'MXN',
      date: '2016-05-16',
      rates: { USD: 0.054796 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-31')
    .times(2)
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504223999,
      historical: true,
      base: 'EUR',
      date: '2017-08-31',
      rates: { USD: 1.191327 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-08')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504223999,
      historical: true,
      base: 'EUR',
      date: '2017-11-08',
      rates: { USD: 1.159559 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-31')
    .times(2)
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504223999,
      historical: true,
      base: 'CAD',
      date: '2017-08-31',
      rates: { USD: 0.801629 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-22')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521763199,
      historical: true,
      base: 'MXN',
      date: '2018-03-22',
      rates: { USD: 0.053542 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-24')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527206399,
      historical: true,
      base: 'USD',
      date: '2018-05-24',
      rates: { GBP: 0.74722 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'GBP',
      date: '2016-12-23',
      rates: { USD: 1.228531 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'EUR',
      date: '2018-05-03',
      rates: { USD: 1.199326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-11-01')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1478044799,
      historical: true,
      base: 'EUR',
      date: '2016-11-01',
      rates: { USD: 1.105945 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'AUD',
      date: '2016-12-27',
      rates: { USD: 0.719114 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-25')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1529971199,
      historical: true,
      base: 'GBP',
      date: '2018-06-25',
      rates: { USD: 1.327863 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'GBP',
      date: '2016-12-23',
      rates: { USD: 1.228531 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-22')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458691199,
      historical: true,
      base: 'AUD',
      date: '2016-03-22',
      rates: { USD: 0.761857 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'USD',
      date: '2018-05-07',
      rates: { GBP: 0.73713 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522195199,
      historical: true,
      base: 'MXN',
      date: '2018-03-27',
      rates: { USD: 0.054425 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'USD',
      date: '2018-05-08',
      rates: { GBP: 0.73779 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { NZD: 1.381604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'GBP',
      date: '2017-03-31',
      rates: { USD: 1.2545 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1528934399,
      historical: true,
      base: 'USD',
      date: '2018-06-13',
      rates: { GBP: 0.74719 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { GBP: 0.74225 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-05')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522972799,
      historical: true,
      base: 'USD',
      date: '2018-04-05',
      rates: { GBP: 0.71388 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'GBP',
      date: '2018-01-08',
      rates: { USD: 1.357092 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-30')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467331199,
      historical: true,
      base: 'USD',
      date: '2016-06-30',
      rates: { UYU: 30.74139 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'AUD',
      date: '2018-03-17',
      rates: { USD: 0.77196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-26')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1506470399,
      historical: true,
      base: 'CAD',
      date: '2017-09-26',
      rates: { USD: 0.808793 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-14')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1489535999,
      historical: true,
      base: 'MXN',
      date: '2017-03-14',
      rates: { USD: 0.050883 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1526255999,
      historical: true,
      base: 'USD',
      date: '2018-05-13',
      rates: { GBP: 0.737959 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'EUR',
      date: '2016-12-23',
      rates: { USD: 1.045474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'CAD',
      date: '2018-05-09',
      rates: { USD: 0.778234 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-03')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457049599,
      historical: true,
      base: 'AUD',
      date: '2016-03-03',
      rates: { USD: 0.735069 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-11')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1505174399,
      historical: true,
      base: 'USD',
      date: '2017-09-11',
      rates: { EUR: 0.836 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-15')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1471305599,
      historical: true,
      base: 'MXN',
      date: '2016-08-15',
      rates: { USD: 0.055326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515715199,
      historical: true,
      base: 'CAD',
      date: '2018-01-11',
      rates: { USD: 0.798601 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'CAD',
      date: '2016-12-28',
      rates: { USD: 0.737915 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-20')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1529539199,
      historical: true,
      base: 'USD',
      date: '2018-06-20',
      rates: { EUR: 0.863397 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'CAD',
      date: '2018-02-06',
      rates: { USD: 0.799686 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-06')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525651199,
      historical: true,
      base: 'USD',
      date: '2018-05-06',
      rates: { GBP: 0.7388 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { EUR: 0.813199 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1528934399,
      historical: true,
      base: 'USD',
      date: '2018-06-13',
      rates: { GBP: 0.74719 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-02')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1454457599,
      historical: true,
      base: 'MXN',
      date: '2016-02-02',
      rates: { USD: 0.054249 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-14')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457999999,
      historical: true,
      base: 'AUD',
      date: '2016-03-14',
      rates: { USD: 0.750984 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'GBP',
      date: '2018-05-15',
      rates: { USD: 1.349747 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-20')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1529539199,
      historical: true,
      base: 'USD',
      date: '2018-06-20',
      rates: { EUR: 0.863397 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { NZD: 1.351298 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'MXN',
      date: '2018-01-07',
      rates: { USD: 0.052143 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-23')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471996799,
      historical: true,
      base: 'USD',
      date: '2016-08-23',
      rates: { UYU: 28.479966 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510963199,
      historical: true,
      base: 'USD',
      date: '2017-11-17',
      rates: { GBP: 0.75677 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'EUR',
      date: '2018-01-07',
      rates: { USD: 1.204091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'EUR',
      date: '2018-05-03',
      rates: { USD: 1.199326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'CAD',
      date: '2018-05-15',
      rates: { USD: 0.776892 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-08-17')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1471478399,
      historical: true,
      base: 'USD',
      date: '2016-08-17',
      rates: { UYU: 28.580173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-05')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515196799,
      historical: true,
      base: 'GBP',
      date: '2018-01-05',
      rates: { USD: 1.356796 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-21')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521676799,
      historical: true,
      base: 'EUR',
      date: '2018-03-21',
      rates: { USD: 1.23518 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-15')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458086399,
      historical: true,
      base: 'AUD',
      date: '2016-03-15',
      rates: { USD: 0.746235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-16')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1489708799,
      historical: true,
      base: 'USD',
      date: '2017-03-16',
      rates: { UYU: 28.200001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-19')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521503999,
      historical: true,
      base: 'GBP',
      date: '2018-03-19',
      rates: { USD: 1.402426 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-10-21')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1477094399,
      historical: true,
      base: 'USD',
      date: '2016-10-21',
      rates: { UYU: 28.040001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-30')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517356799,
      historical: true,
      base: 'CAD',
      date: '2018-01-30',
      rates: { USD: 0.810637 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1467676799,
      historical: true,
      base: 'USD',
      date: '2016-07-04',
      rates: { UYU: 30.54732 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-05')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530835199,
      historical: true,
      base: 'USD',
      date: '2018-07-05',
      rates: { GBP: 0.75632 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'USD',
      date: '2018-05-09',
      rates: { GBP: 0.73834 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-12')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518479999,
      historical: true,
      base: 'USD',
      date: '2018-02-12',
      rates: { GBP: 0.72196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-07')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1528415999,
      historical: true,
      base: 'USD',
      date: '2018-06-07',
      rates: { GBP: 0.74529 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'EUR',
      date: '2016-12-07',
      rates: { USD: 1.076194 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-06-28')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1498694399,
      historical: true,
      base: 'USD',
      date: '2017-06-28',
      rates: { NZD: 1.368601 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-18')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458345599,
      historical: true,
      base: 'AUD',
      date: '2016-03-18',
      rates: { USD: 0.760468 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'EUR',
      date: '2018-01-07',
      rates: { USD: 1.204091 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504310399,
      historical: true,
      base: 'USD',
      date: '2017-09-01',
      rates: { EUR: 0.84304 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { NZD: 1.431904 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-25')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508975999,
      historical: true,
      base: 'CAD',
      date: '2017-10-25',
      rates: { USD: 0.781519 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'EUR',
      date: '2017-09-08',
      rates: { USD: 1.203943 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522713599,
      historical: true,
      base: 'USD',
      date: '2018-04-02',
      rates: { GBP: 0.71191 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1504915199,
      historical: true,
      base: 'USD',
      date: '2017-09-08',
      rates: { EUR: 0.830604 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'GBP',
      date: '2018-05-07',
      rates: { USD: 1.356613 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-03')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1522799999,
      historical: true,
      base: 'USD',
      date: '2018-04-03',
      rates: { EUR: 0.814196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-12')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518479999,
      historical: true,
      base: 'USD',
      date: '2018-02-12',
      rates: { GBP: 0.72196 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527983999,
      historical: true,
      base: 'USD',
      date: '2018-06-02',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-21')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1506038399,
      historical: true,
      base: 'USD',
      date: '2017-09-21',
      rates: { EUR: 0.836803 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1465084799,
      historical: true,
      base: 'USD',
      date: '2016-06-04',
      rates: { UYU: 31.01661 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525737599,
      historical: true,
      base: 'GBP',
      date: '2018-05-07',
      rates: { USD: 1.356613 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-18')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458345599,
      historical: true,
      base: 'AUD',
      date: '2016-03-18',
      rates: { USD: 0.760468 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508284799,
      historical: true,
      base: 'CAD',
      date: '2017-10-17',
      rates: { USD: 0.800173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-04')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525478399,
      historical: true,
      base: 'CAD',
      date: '2018-05-04',
      rates: { USD: 0.778692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'GBP',
      date: '2017-04-17',
      rates: { USD: 1.255871 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-07-10')
    .times(2)
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1499731199,
      historical: true,
      base: 'MXN',
      date: '2017-07-10',
      rates: { USD: 0.055746 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-17')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458259199,
      historical: true,
      base: 'AUD',
      date: '2016-03-17',
      rates: { USD: 0.764229 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-09')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1520639999,
      historical: true,
      base: 'CAD',
      date: '2018-03-09',
      rates: { USD: 0.780759 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-20')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521590399,
      historical: true,
      base: 'GBP',
      date: '2018-03-20',
      rates: { USD: 1.400514 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-02')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1454457599,
      historical: true,
      base: 'MXN',
      date: '2016-02-02',
      rates: { USD: 0.054249 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-23')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458777599,
      historical: true,
      base: 'AUD',
      date: '2016-03-23',
      rates: { USD: 0.753238 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-10')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1531267199,
      historical: true,
      base: 'USD',
      date: '2018-07-10',
      rates: { NZD: 1.466301 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'GBP',
      date: '2018-01-07',
      rates: { USD: 1.357682 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'EUR',
      date: '2016-12-07',
      rates: { USD: 1.076194 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527811199,
      historical: true,
      base: 'GBP',
      date: '2018-05-31',
      rates: { USD: 1.328974 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-04')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530748799,
      historical: true,
      base: 'USD',
      date: '2018-07-04',
      rates: { GBP: 0.75582 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-28')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1522281599,
      historical: true,
      base: 'EUR',
      date: '2018-03-28',
      rates: { USD: 1.23148 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1523318399,
      historical: true,
      base: 'USD',
      date: '2018-04-09',
      rates: { NZD: 1.367702 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'EUR',
      date: '2018-05-09',
      rates: { USD: 1.18497 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-22')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1519343999,
      historical: true,
      base: 'USD',
      date: '2018-02-22',
      rates: { GBP: 0.71681 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'MXN',
      date: '2018-03-17',
      rates: { USD: 0.053532 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-05')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1454716799,
      historical: true,
      base: 'AUD',
      date: '2016-02-05',
      rates: { USD: 0.706729 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-05')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1522972799,
      historical: true,
      base: 'USD',
      date: '2018-04-05',
      rates: { GBP: 0.71388 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-07')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1481155199,
      historical: true,
      base: 'GBP',
      date: '2016-12-07',
      rates: { USD: 1.262802 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528502399,
      historical: true,
      base: 'CAD',
      date: '2018-06-08',
      rates: { USD: 0.773931 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517270399,
      historical: true,
      base: 'CAD',
      date: '2018-01-29',
      rates: { USD: 0.810669 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-28')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482969599,
      historical: true,
      base: 'CAD',
      date: '2016-12-28',
      rates: { USD: 0.737915 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-25')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1529971199,
      historical: true,
      base: 'GBP',
      date: '2018-06-25',
      rates: { USD: 1.327863 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-05')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528243199,
      historical: true,
      base: 'CAD',
      date: '2018-06-05',
      rates: { USD: 0.772929 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'CAD',
      date: '2018-05-18',
      rates: { USD: 0.776516 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-05-16')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1494979199,
      historical: true,
      base: 'EUR',
      date: '2017-05-16',
      rates: { USD: 1.109631 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-20')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508543999,
      historical: true,
      base: 'EUR',
      date: '2017-10-20',
      rates: { USD: 1.178823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-20')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508543999,
      historical: true,
      base: 'EUR',
      date: '2017-10-20',
      rates: { USD: 1.178823 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-10')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525996799,
      historical: true,
      base: 'CAD',
      date: '2018-05-10',
      rates: { USD: 0.782987 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1512172799,
      historical: true,
      base: 'USD',
      date: '2017-12-01',
      rates: { NZD: 1.451104 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-06')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525651199,
      historical: true,
      base: 'USD',
      date: '2018-05-06',
      rates: { GBP: 0.7388 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'MXN',
      date: '2018-05-03',
      rates: { USD: 0.052488 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-10')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1531267199,
      historical: true,
      base: 'USD',
      date: '2018-07-10',
      rates: { NZD: 1.466301 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'GBP',
      date: '2016-12-23',
      rates: { USD: 1.228531 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-05-08')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1494287999,
      historical: true,
      base: 'EUR',
      date: '2017-05-08',
      rates: { USD: 1.092893 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-05')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1512518399,
      historical: true,
      base: 'GBP',
      date: '2017-12-05',
      rates: { USD: 1.341507 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1520035199,
      historical: true,
      base: 'USD',
      date: '2018-03-02',
      rates: { GBP: 0.72446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-04')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525478399,
      historical: true,
      base: 'CAD',
      date: '2018-05-04',
      rates: { USD: 0.778692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'MXN',
      date: '2018-02-06',
      rates: { USD: 0.053698 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'EUR',
      date: '2017-10-11',
      rates: { USD: 1.186798 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'USD',
      date: '2018-05-22',
      rates: { EUR: 0.848097 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-15')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526428799,
      historical: true,
      base: 'CAD',
      date: '2018-05-15',
      rates: { USD: 0.776892 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488931199,
      historical: true,
      base: 'MXN',
      date: '2017-03-07',
      rates: { USD: 0.051336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'USD',
      date: '2018-01-08',
      rates: { GBP: 0.73687 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-13')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1520985599,
      historical: true,
      base: 'CAD',
      date: '2018-03-13',
      rates: { USD: 0.771706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-05')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1528243199,
      historical: true,
      base: 'CAD',
      date: '2018-06-05',
      rates: { USD: 0.772929 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'MXN',
      date: '2016-12-27',
      rates: { USD: 0.048155 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'USD',
      date: '2018-05-02',
      rates: { GBP: 0.73684 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-21')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458604799,
      historical: true,
      base: 'AUD',
      date: '2016-03-21',
      rates: { USD: 0.758164 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-08')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525823999,
      historical: true,
      base: 'CAD',
      date: '2018-05-08',
      rates: { USD: 0.77235 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-09')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1525910399,
      historical: true,
      base: 'USD',
      date: '2018-05-09',
      rates: { GBP: 0.73834 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'MXN',
      date: '2018-05-03',
      rates: { USD: 0.052488 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-11-14')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1510703999,
      historical: true,
      base: 'USD',
      date: '2017-11-14',
      rates: { GBP: 0.76001 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-02-26')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1456531199,
      historical: true,
      base: 'AUD',
      date: '2016-02-26',
      rates: { USD: 0.712692 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-27')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1509148799,
      historical: true,
      base: 'EUR',
      date: '2017-10-27',
      rates: { USD: 1.1613 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-02')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525305599,
      historical: true,
      base: 'AUD',
      date: '2018-05-02',
      rates: { USD: 0.748782 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-08')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515455999,
      historical: true,
      base: 'GBP',
      date: '2018-01-08',
      rates: { USD: 1.357092 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517615999,
      historical: true,
      base: 'USD',
      date: '2018-02-02',
      rates: { GBP: 0.70808 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'EUR',
      date: '2018-02-06',
      rates: { USD: 1.238391 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-06')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1517961599,
      historical: true,
      base: 'GBP',
      date: '2018-02-06',
      rates: { USD: 1.395771 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-23')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1519430399,
      historical: true,
      base: 'CAD',
      date: '2018-02-23',
      rates: { USD: 0.792014 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-17')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508284799,
      historical: true,
      base: 'CAD',
      date: '2017-10-17',
      rates: { USD: 0.800173 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'EUR',
      date: '2018-03-17',
      rates: { USD: 1.229951 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-13')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1518566399,
      historical: true,
      base: 'USD',
      date: '2018-02-13',
      rates: { GBP: 0.72021 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-17')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1508284799,
      historical: true,
      base: 'EUR',
      date: '2017-10-17',
      rates: { USD: 1.177446 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-12-18')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1513641599,
      historical: true,
      base: 'GBP',
      date: '2017-12-18',
      rates: { USD: 1.337954 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-01-24')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1485302399,
      historical: true,
      base: 'USD',
      date: '2017-01-24',
      rates: { UYU: 28.250188 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1504310399,
      historical: true,
      base: 'USD',
      date: '2017-09-01',
      rates: { NZD: 1.396904 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517615999,
      historical: true,
      base: 'USD',
      date: '2018-02-02',
      rates: { GBP: 0.70808 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-02-21')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1487721599,
      historical: true,
      base: 'EUR',
      date: '2017-02-21',
      rates: { USD: 1.05452 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-04-17')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1492473599,
      historical: true,
      base: 'MXN',
      date: '2017-04-17',
      rates: { USD: 0.054058 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-02-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1517529599,
      historical: true,
      base: 'USD',
      date: '2018-02-01',
      rates: { GBP: 0.70095 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-09-21')
    .times(2)
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1506038399,
      historical: true,
      base: 'USD',
      date: '2017-09-21',
      rates: { EUR: 0.836803 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-17')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1521331199,
      historical: true,
      base: 'GBP',
      date: '2018-03-17',
      rates: { USD: 1.393417 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-07')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1488931199,
      historical: true,
      base: 'MXN',
      date: '2017-03-07',
      rates: { USD: 0.051336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-27')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482883199,
      historical: true,
      base: 'AUD',
      date: '2016-12-27',
      rates: { USD: 0.719114 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-29')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1530316799,
      historical: true,
      base: 'CAD',
      date: '2018-06-29',
      rates: { USD: 0.761264 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-12-23')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1482537599,
      historical: true,
      base: 'EUR',
      date: '2016-12-23',
      rates: { USD: 1.045474 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-03-13')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1520985599,
      historical: true,
      base: 'CAD',
      date: '2018-03-13',
      rates: { USD: 0.771706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-10-11')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1507766399,
      historical: true,
      base: 'CAD',
      date: '2017-10-11',
      rates: { USD: 0.803187 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1530489599,
      historical: true,
      base: 'USD',
      date: '2018-07-01',
      rates: { GBP: 0.75706 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1514851199,
      historical: true,
      base: 'USD',
      date: '2018-01-01',
      rates: { GBP: 0.74002 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-06-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'GBP' })
    .reply(200, {
      success: true,
      timestamp: 1527897599,
      historical: true,
      base: 'USD',
      date: '2018-06-01',
      rates: { GBP: 0.74934 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-07-02')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1530575999,
      historical: true,
      base: 'USD',
      date: '2018-07-02',
      rates: { NZD: 1.489798 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-20')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458518399,
      historical: true,
      base: 'AUD',
      date: '2016-03-20',
      rates: { USD: 0.759753 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-04')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1457135999,
      historical: true,
      base: 'AUD',
      date: '2016-03-04',
      rates: { USD: 0.743973 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-04-19')
    .query({ access_key: /.*/i, base: 'MXN', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1524182399,
      historical: true,
      base: 'MXN',
      date: '2018-04-19',
      rates: { USD: 0.054211 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-18')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526687999,
      historical: true,
      base: 'EUR',
      date: '2018-05-18',
      rates: { USD: 1.177296 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-03')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1525391999,
      historical: true,
      base: 'EUR',
      date: '2018-05-03',
      rates: { USD: 1.199326 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'CAD',
      date: '2018-05-22',
      rates: { USD: 0.780336 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'GBP',
      date: '2017-03-31',
      rates: { USD: 1.2545 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-19')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466380799,
      historical: true,
      base: 'USD',
      date: '2016-06-19',
      rates: { UYU: 30.57216 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-14')
    .query({ access_key: /.*/i, base: 'CAD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1526342399,
      historical: true,
      base: 'CAD',
      date: '2018-05-14',
      rates: { USD: 0.781226 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-08-01')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'NZD' })
    .reply(200, {
      success: true,
      timestamp: 1501631999,
      historical: true,
      base: 'USD',
      date: '2017-08-01',
      rates: { NZD: 1.346204 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-19')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458431999,
      historical: true,
      base: 'AUD',
      date: '2016-03-19',
      rates: { USD: 0.760534 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-05-22')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'EUR' })
    .reply(200, {
      success: true,
      timestamp: 1527033599,
      historical: true,
      base: 'USD',
      date: '2018-05-22',
      rates: { EUR: 0.848097 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-03-20')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1458518399,
      historical: true,
      base: 'AUD',
      date: '2016-03-20',
      rates: { USD: 0.759753 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-10-19')
    .query({ access_key: /.*/i, base: 'EUR', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1476921599,
      historical: true,
      base: 'EUR',
      date: '2016-10-19',
      rates: { USD: 1.097813 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2017-03-31')
    .query({ access_key: /.*/i, base: 'GBP', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1491004799,
      historical: true,
      base: 'GBP',
      date: '2017-03-31',
      rates: { USD: 1.2545 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2018-01-07')
    .query({ access_key: /.*/i, base: 'AUD', symbols: 'USD' })
    .reply(200, {
      success: true,
      timestamp: 1515369599,
      historical: true,
      base: 'AUD',
      date: '2018-01-07',
      rates: { USD: 0.78635 },
    });

  nock('https://data.fixer.io:80', { encodedQueryParams: true })
    .get('/2016-06-26')
    .query({ access_key: /.*/i, base: 'USD', symbols: 'UYU' })
    .reply(200, {
      success: true,
      timestamp: 1466985599,
      historical: true,
      base: 'USD',
      date: '2016-06-26',
      rates: { UYU: 30.6655 },
    });
};

initNock();

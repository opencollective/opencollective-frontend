'use strict';

const DRY_RUN = false;

const uuid = require('node-uuid');
const Promise = require('bluebird');

const pick = (obj, attributes) => {
  const res = {};
  attributes.map(attr => {
    res[attr] = obj[attr];
  })
  return res;
}

let totalTransactions = 0;

const insert = (sequelize, table, entry) => {
  delete entry.id;
  if (DRY_RUN) {
    return console.log(`INSERT INTO "${table}":`, entry);
  }
  entry.data = entry.data &&  JSON.stringify(entry.data);
  return sequelize.query(`
    INSERT INTO "${table}" ("${Object.keys(entry).join('","')}") VALUES (:${Object.keys(entry).join(",:")})
  `, { replacements: entry });
}

const updateTransactions = (sequelize) => {

  const processTransaction = (transaction) => {

    totalTransactions++;

    const oppositeTransaction = {
      ...transaction,
      type: (-transaction.amount > 0) ? 'CREDIT' : 'DEBIT',
      FromCollectiveId: transaction.CollectiveId,
      CollectiveId: transaction.FromCollectiveId,
      amount: -transaction.netAmountInCollectiveCurrency,
      netAmountInCollectiveCurrency: -transaction.amount,
      uuid: uuid.v4()
    }
    if (DRY_RUN) {
      console.log("------------------------------------")
      console.log("Processing", transaction);
    }
    return insert(sequelize, "Transactions", oppositeTransaction);
  };

  const limit = DRY_RUN ? 'LIMIT 10' : '';

  return sequelize.query(`SELECT * FROM "Transactions" ${limit}`, { type: sequelize.QueryTypes.SELECT })
  .then(rows => rows && Promise.map(rows, processTransaction, { concurrency: 10 }))
  .then(() => sequelize.query(`UPDATE "Transactions" SET type='CREDIT' WHERE type='DONATION'`))
  .then(() => sequelize.query(`UPDATE "Transactions" SET type='DEBIT' WHERE type='EXPENSE'`))
}

module.exports = {
  up: function (queryInterface, DataTypes) {
    return updateTransactions(queryInterface.sequelize)
    .then(() => queryInterface.renameColumn("Transactions", "txnCurrency", "hostCurrency"))
    .then(() => queryInterface.renameColumn("Transactions", "amountInTxnCurrency", "amountInHostCurrency"))
    .then(() => queryInterface.renameColumn("Transactions", "platformFeeInTxnCurrency", "platformFeeInHostCurrency"))
    .then(() => queryInterface.renameColumn("Transactions", "hostFeeInTxnCurrency", "hostFeeInHostCurrency"))
    .then(() => queryInterface.renameColumn("Transactions", "txnCurrencyFxRate", "hostCurrencyFxRate"))
    .then(() => queryInterface.renameColumn("Transactions", "paymentProcessorFeeInTxnCurrency", "paymentProcessorFeeInHostCurrency"))
    .then(() => {
        if (DRY_RUN) {
          throw new Error("Don't record as done please");
        } else {
          console.log(totalTransactions, "transactions processed");
        }
      })
  },

  down: function (queryInterface, DataTypes) {
    console.log(">>> no downgrade possible");
  }
};

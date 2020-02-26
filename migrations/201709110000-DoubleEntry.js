'use strict';

const DRY_RUN = false;

const { v4: uuidv4 } = require('uuid');
const Promise = require('bluebird');

const pick = (obj, attributes) => {
  const res = {};
  attributes.map(attr => {
    res[attr] = obj[attr];
  });
  return res;
};

let totalTransactions = 0;

const insert = (sequelize, table, entry) => {
  delete entry.id;
  if (DRY_RUN) {
    return console.log(`INSERT INTO "${table}":`, entry);
  }
  entry.data = entry.data && JSON.stringify(entry.data);
  return sequelize.query(
    `
    INSERT INTO "${table}" ("${Object.keys(entry).join('","')}") VALUES (:${Object.keys(entry).join(',:')})
  `,
    { replacements: entry },
  );
};

const updateTransactions = sequelize => {
  const processTransaction = transaction => {
    totalTransactions++;

    transaction.txnCurrencyFxRate = transaction.txnCurrencyFxRate || 1;
    transaction.TransactionGroup = uuidv4();

    const updateOriginalTransaction = () =>
      sequelize.query(`UPDATE "Transactions" SET "TransactionGroup"=:TransactionGroup WHERE id=:id`, {
        replacements: {
          id: transaction.id,
          TransactionGroup: transaction.TransactionGroup,
        },
      });

    const oppositeTransaction = {
      ...transaction,
      type: -transaction.amount > 0 ? 'CREDIT' : 'DEBIT',
      FromCollectiveId: transaction.CollectiveId,
      CollectiveId: transaction.FromCollectiveId,
      amount: -transaction.netAmountInCollectiveCurrency,
      netAmountInCollectiveCurrency: -transaction.amount,
      amountInTxnCurrency: -transaction.netAmountInCollectiveCurrency / transaction.txnCurrencyFxRate,
      hostFeeInTxnCurrency: null,
      uuid: uuidv4(),
    };
    if (DRY_RUN) {
      console.log('------------------------------------');
      console.log('Processing', transaction);
    }

    // if the donation is from the host (add funds), we need to add the funds first to the Host Collective
    if (
      transaction.FromCollectiveId === transaction.HostCollectiveId &&
      transaction.amount > 0 &&
      !transaction.PaymentMethodId &&
      !transaction.platformFeeInHostCurrency
    ) {
      const addFundsTransaction = {
        ...transaction,
        type: 'CREDIT',
        CollectiveId: transaction.HostCollectiveId,
        HostCollectiveId: transaction.HostCollectiveId,
        FromCollectiveId: null, // money doesn't come from a collective but from an external source (Host's bank account)
        currency: transaction.currency,
        netAmountInCollectiveCurrency: transaction.amount,
        uuid: uuidv4(),
        hostFeeInTxnCurrency: null,
        platformFeeInTxnCurrency: null,
        paymentProcessorFeeInTxnCurrency: null,
      };
      // console.log(">>> adding funds", addFundsTransaction);
      return insert(sequelize, 'Transactions', addFundsTransaction)
        .then(() => insert(sequelize, 'Transactions', oppositeTransaction))
        .then(updateOriginalTransaction);
    } else {
      return insert(sequelize, 'Transactions', oppositeTransaction).then(updateOriginalTransaction);
    }
  };

  const limit = DRY_RUN ? 'LIMIT 10' : '';

  return sequelize
    .query(`SELECT * FROM "Transactions" ${limit}`, {
      type: sequelize.QueryTypes.SELECT,
    })
    .then(rows => rows && Promise.map(rows, processTransaction, { concurrency: 10 }))
    .then(() => sequelize.query(`UPDATE "Transactions" SET type='CREDIT' WHERE type='DONATION'`))
    .then(() => sequelize.query(`UPDATE "Transactions" SET type='DEBIT' WHERE type='EXPENSE'`));
};

module.exports = {
  up: function(queryInterface, DataTypes) {
    // temporary column for binding transactions together, eventually they should all have the same OrderId if they are part of a same Order
    return queryInterface
      .addColumn('Transactions', 'TransactionGroup', { type: DataTypes.UUID })
      .then(() => updateTransactions(queryInterface.sequelize))
      .then(() => queryInterface.renameColumn('Transactions', 'txnCurrency', 'hostCurrency'))
      .then(() => queryInterface.renameColumn('Transactions', 'amountInTxnCurrency', 'amountInHostCurrency'))
      .then(() => queryInterface.renameColumn('Transactions', 'platformFeeInTxnCurrency', 'platformFeeInHostCurrency'))
      .then(() => queryInterface.renameColumn('Transactions', 'hostFeeInTxnCurrency', 'hostFeeInHostCurrency'))
      .then(() => queryInterface.renameColumn('Transactions', 'txnCurrencyFxRate', 'hostCurrencyFxRate'))
      .then(() =>
        queryInterface.renameColumn(
          'Transactions',
          'paymentProcessorFeeInTxnCurrency',
          'paymentProcessorFeeInHostCurrency',
        ),
      )
      .then(() => {
        if (DRY_RUN) {
          throw new Error("Don't record as done please");
        } else {
          console.log(totalTransactions, 'transactions processed');
        }
      });
  },

  down: function(queryInterface, DataTypes) {
    console.log('>>> no downgrade possible');
  },
};

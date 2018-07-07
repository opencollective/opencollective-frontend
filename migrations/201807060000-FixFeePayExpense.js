'use strict';
const DRY_MODE = false;
const Promise = require('bluebird');

module.exports = {
  up: (queryInterface, sequelize) => {
    // find all transactions related to an expense that has a paymentProcessorFee
    return queryInterface.sequelize.query(`
      SELECT * FROM "Transactions"
      WHERE "paymentProcessorFeeInHostCurrency" < 0
        AND "ExpenseId" IS NOT NULL
        AND "deletedAt" is NULL
      `, { type: sequelize.QueryTypes.SELECT })
    .then(transactions => {
      console.log(">>>", transactions.length, "transactions found");
      const needFixing = [], queries = [];
      transactions.map(transaction => {
        switch (transaction.type) {
          case 'DEBIT':
            if (transaction.netAmountInCollectiveCurrency != transaction.amount + transaction.paymentProcessorFeeInHostCurrency) {
              const newNetAmount = transaction.amount + transaction.paymentProcessorFeeInHostCurrency;
              console.log(">>> ", transaction.type, "id", transaction.id, "amount:", transaction.amount, transaction.currency, "paymentProcessorFee:", transaction.paymentProcessorFeeInHostCurrency, transaction.hostCurrency, "net amount:", transaction.netAmountInCollectiveCurrency, "new net amount: ", newNetAmount); 
              needFixing.push(transaction);
              queries.push(`UPDATE "Transactions" SET "netAmountInCollectiveCurrency"=${newNetAmount} WHERE id=${transaction.id}`);
            }
            break;
          case 'CREDIT':
            if (transaction.amount != transaction.netAmountInCollectiveCurrency - transaction.paymentProcessorFeeInHostCurrency) {
              const newAmount = transaction.netAmountInCollectiveCurrency - transaction.paymentProcessorFeeInHostCurrency;
              console.log(">>>", transaction.type, "id", transaction.id, "amount:", transaction.amount, transaction.currency, "paymentProcessorFee:", transaction.paymentProcessorFeeInHostCurrency, transaction.hostCurrency, "net amount:", transaction.netAmountInCollectiveCurrency, "new amount: ", newAmount); 
              queries.push(`UPDATE "Transactions" SET "amount"=${newAmount} WHERE id=${transaction.id}`);
               needFixing.push(transaction);
            }
            break;
        }
      })
      console.log(">>> fixing", needFixing.length, "transactions");
      if (!DRY_MODE) {
        return Promise.map(queries, query => queryInterface.sequelize.query(query));
      }
    })
    .then(() => {
      if (DRY_MODE) {
        throw new Error("Success!");
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); // No way to revert this
  }
};

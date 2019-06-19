'use strict';

import models, { sequelize, Op } from '../server/models';
import Promise from 'bluebird';

const fetchTransactions = async () => {
  const query = {
    attributes: [
      'id',
      'type',
      'description',
      'amount',
      'currency',
      'createdAt',
      'updatedAt',
      'CollectiveId',
      'CreatedByUserId',
      'PaymentMethodId',
      'deletedAt',
      'data',
      'OrderId',
      'platformFeeInHostCurrency',
      'hostFeeInHostCurrency',
      'paymentProcessorFeeInHostCurrency',
      'hostCurrency',
      'hostCurrencyFxRate',
      'amountInHostCurrency',
      'netAmountInCollectiveCurrency',
      'ExpenseId',
      'uuid',
      'FromCollectiveId',
      'HostCollectiveId',
      'TransactionGroup',
      'RefundTransactionId',
      'UsingVirtualCardFromCollectiveId',
      'taxAmount',
    ],
    where: { taxAmount: { [Op.gt]: 0 } },
  };
  return await models.Transaction.findAll(query);
};

const toNegative = n => (n > 0 ? -n : n);

const fixTransaction = transaction => {
  const updatedTransaction = { ...transaction.dataValues };
  delete updatedTransaction.id;
  updatedTransaction.taxAmount = toNegative(transaction.taxAmount);
  if (transaction.type === 'CREDIT') {
    updatedTransaction.netAmountInCollectiveCurrency =
      transaction.netAmountInCollectiveCurrency + updatedTransaction.taxAmount;
  } else if (transaction.type === 'DEBIT') {
    updatedTransaction.amount = transaction.amount - updatedTransaction.taxAmount;
    updatedTransaction.amountInHostCurrency = transaction.amountInHostCurrency - updatedTransaction.taxAmount;
  }
  return updatedTransaction;
};

const processTransaction = async transaction => {
  let dbTransaction;
  const updatedTransaction = fixTransaction(transaction);
  console.log('*******************************************************');
  console.log('>>> transaction.description', transaction.dataValues.description);
  console.log('>>> transaction.TransactionGroup', transaction.dataValues.TransactionGroup);
  console.log('*******************************************************');
  console.log('>>> transaction.type', transaction.dataValues.type);
  console.log('>>> transaction.amount', transaction.dataValues.amount);
  console.log('>>> transaction.amountInHostCurrency', transaction.dataValues.amountInHostCurrency);
  console.log('>>> transaction.taxAmount', transaction.dataValues.taxAmount);
  console.log('>>> transaction.netAmountInCollectiveCurrency', transaction.dataValues.netAmountInCollectiveCurrency);
  console.log('*******************************************************');
  console.log('>>> updatedTransaction.type', updatedTransaction.type);
  console.log('>>> updatedTransaction.amount', updatedTransaction.amount);
  console.log('>>> updatedTransaction.amountInHostCurrency', updatedTransaction.amountInHostCurrency);
  console.log('>>> updatedTransaction.taxAmount', updatedTransaction.taxAmount);
  console.log('>>> updatedTransaction.netAmountInCollectiveCurrency', updatedTransaction.netAmountInCollectiveCurrency);
  console.log('*******************************************************\n\n');
  try {
    dbTransaction = await sequelize.transaction();
    await transaction.destroy({ transaction: dbTransaction });
    await models.Transaction.create(updatedTransaction, { transaction: dbTransaction });
    await dbTransaction.commit();
  } catch (e) {
    console.error('>>> db transaction error', e);
    await dbTransaction.rollback();
    throw e;
  }
};

/**
 * `taxAmount` like any other fee should be a negative number
 * and should be subtracted from the netAmountInCollectiveCurrency
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transactions = await fetchTransactions();
    await Promise.map(transactions, processTransaction);
  },

  down: async queryInterface => {},
};

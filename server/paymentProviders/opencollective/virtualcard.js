import moment from 'moment';
import uuidv4 from 'uuid/v4';
import Promise from 'bluebird';
import { get } from 'lodash';
import models, { Op, sequelize } from '../../models';
import * as libpayments from '../../lib/payments';
import * as libtransactions from '../../lib/transactions';

/**
 * Virtual Card Payment method - This payment Method works basically as an alias
 * to other Payment method(field "SourcePaymentMethodId") that will create transactions
 * and then the payment methods of those transactions will be replaced by
 * the virtual card payment method that first processed the order.
*/

/** Get the balance of a virtual card card
 * @param {models.PaymentMethod} paymentMethod is the instance of the
 *  virtual card payment method.
 * @return {Object} with amount & currency from the payment method.
 */
async function getBalance(paymentMethod) {
  if (!libpayments.isProvider('opencollective.virtualcard', paymentMethod)) {
    throw new Error(`Expected opencollective.virtualcard but got ${paymentMethod.service}.${paymentMethod.type}`);
  }
  /* Result will be negative (We're looking for DEBIT transactions) */
  const spent = await libtransactions.sum({
    PaymentMethodId: paymentMethod.id,
    currency: paymentMethod.currency,
    type: 'DEBIT',
  });
  return {
    amount: paymentMethod.initialBalance + spent,
    currency: paymentMethod.currency,
  };
}

/** Process a virtual card order
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} the double entry generated transactions.
 */
async function processOrder(order) {
  const paymentMethod = await models.PaymentMethod.findById(order.paymentMethod.id);
  // check if payment Method has expired
  if (!paymentMethod.expiryDate || moment(paymentMethod.expiryDate) < moment()) {
    throw new Error('Payment method has already expired');
  }

  // Checking if balance is ok or will still be after completing the order
  const balance = await getBalance(paymentMethod);
  if (!balance || balance.amount <= 0) {
    throw new Error('Virtual card has no balance to complete this order');
  }
  if ( (balance.amount - order.totalAmount) < 0 ) {
    throw new Error(`Order amount exceeds balance(${balance.amount} ${paymentMethod.currency})`);
  }

  // Making sure the SourcePaymentMethodId is Set(requirement for virtual cards)
  if (!get(paymentMethod, 'SourcePaymentMethodId')) {
    throw new Error('Virtual Card payment method must have a value a "SourcePaymentMethodId" defined');
  }
  // finding Source Payment method and update order payment method properties
  const sourcePaymentMethod = await models.PaymentMethod.findById(paymentMethod.SourcePaymentMethodId);
  order.PaymentMethodId = sourcePaymentMethod.id;
  order.paymentMethod = sourcePaymentMethod;
  // finding the payment provider lib to execute the order
  const sourcePaymentMethodProvider = libpayments.findPaymentMethodProvider(sourcePaymentMethod);

  // gets the Credit transaction generated
  const creditTransaction = await sourcePaymentMethodProvider.processOrder(order);
  // gets the Debit transaction generated through the TransactionGroup field.
  const debitTransaction = await models.Transaction.findOne({
    where: {
      type: 'DEBIT',
      TransactionGroup: creditTransaction.TransactionGroup,
    },
  });
  // Updating already created transactions to use the Virtual Payment Method id instead
  const updatedPaymentMethodTransactions =
    await Promise.map([creditTransaction, debitTransaction], async (transaction) => {
      await transaction.update({ PaymentMethodId: paymentMethod.id });
      return transaction;
  });
  return updatedPaymentMethodTransactions[0];
}

/** Create Virtual payment method through an organization
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {String} [args.description] The description of the new payment
 *  method.
 * @param {Number} args.CollectiveId The ID of the organization creating the virtual card.
 * @param {Number} [args.PaymentMethodId] The ID of the Source Payment method the
 *                 organization wants to use
 * @param {Number} args.totalAmount The total amount that will be
 *  credited to the newly created payment method.
 * @param {Date} [args.expiryDate] The expiry date of the payment method
 * @returns {models.PaymentMethod + code} return the virtual card payment method with
            an extra property "code" that is basically the last 8 digits of the UUID
 */
async function create(args) {
  const collective = await models.Collective.findById(args.CollectiveId);
  const hostCollective = await models.Collective.findById(collective.HostCollectiveId);
  const pmDescription = `${args.totalAmount} ${hostCollective.currency} Virtual card by ${collective.name}`;
  let sourcePaymentMethodId = args.PaymentMethodId;
  if (!args.PaymentMethodId) {
    const sourcePaymentMethod = await models.PaymentMethod.findOne({
      where: {
        CollectiveId: collective.id,
        service: 'stripe',
        type: 'creditcard',
      },
    });
    if (!sourcePaymentMethod) {
      throw Error(`Collective id ${collective.id} needs to have a credit card to create virtual cards.`);
    }
    sourcePaymentMethodId = sourcePaymentMethod.id;
  }
  const expiryDate = args.expiryDate ? moment(args.expiryDate).format() : moment().add(3, 'months').format();
  // creates a new Virtual card Payment method
  const paymentMethod = await models.PaymentMethod.create({
    name: args.description || pmDescription,
    initialBalance: args.totalAmount,
    currency: hostCollective.currency,
    CollectiveId: args.CollectiveId,
    expiryDate: expiryDate,
    uuid: uuidv4(),
    service: 'opencollective',
    type: 'virtualcard',
    SourcePaymentMethodId: sourcePaymentMethodId,
    createdAt: new Date,
    updatedAt: new Date,
  });
  // adding code to payment method
  paymentMethod.code = paymentMethod.uuid.slice(-8);
  return paymentMethod;
}

/** Claim the Virtual Card Payment Method By an (existing or not) user
 * @param {Object} args contains the parameters
 * @param {String} args.code The 8 last digits of the UUID
 * @param {email} args.email The email of the user claiming the virtual card
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
async function claim(args) {
  // validate code
  const virtualCardPaymentMethod = await models.PaymentMethod.findOne({
    where: sequelize.and(
        sequelize.where(sequelize.cast(sequelize.col('uuid'), 'text'), { [Op.like]: `%${args.code}` }),
        { service: 'opencollective' },
        { type: 'virtualcard' },
      ),
  });
  if (!virtualCardPaymentMethod) {
    throw Error(`Code "${args.code}" invalid: No virtual card Found`);
  }
  const sourcePaymentMethod = await models.PaymentMethod.findById(virtualCardPaymentMethod.SourcePaymentMethodId);
  // if the virtual card PM Collective Id is different than the Source PM Collective Id
  // it means this virtual card was already claimend
  if (!sourcePaymentMethod || sourcePaymentMethod.CollectiveId !== virtualCardPaymentMethod.CollectiveId) {
    throw Error('Virtual card not available to be claimed.');
  }
  // find or creating a user with its collective
  const user = await models.User.findOrCreateByEmail(args.email);
  // updating virtual card with collective Id of the user
  await virtualCardPaymentMethod.update({ CollectiveId: user.CollectiveId });
  return virtualCardPaymentMethod;
}

/* Expected API of a Payment Method Type */
export default {
  features: {
    recurring: true,
    waitToCharge: false,
  },
  getBalance,
  processOrder,
  create,
  claim,
};

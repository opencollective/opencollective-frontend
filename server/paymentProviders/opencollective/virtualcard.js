import moment from 'moment';
import uuidv4 from 'uuid/v4';
import { get } from 'lodash';
import models, { Op, sequelize } from '../../models';
import * as libpayments from '../../lib/payments';
import * as libtransactions from '../../lib/transactions';
import { formatCurrency } from '../../lib/utils';

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
    throw new Error(
      `Expected opencollective.virtualcard but got ${paymentMethod.service}.${
        paymentMethod.type
      }`,
    );
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
  const paymentMethod = await models.PaymentMethod.findById(
    order.paymentMethod.id,
  );
  // check if payment Method has expired
  if (
    !paymentMethod.expiryDate ||
    moment(paymentMethod.expiryDate) < moment()
  ) {
    throw new Error('Payment method has already expired');
  }

  // Checking if balance is ok or will still be after completing the order
  const balance = await getBalance(paymentMethod);
  if (!balance || balance.amount <= 0) {
    throw new Error('Virtual card has no balance to complete this order');
  }
  if (balance.amount - order.totalAmount < 0) {
    throw new Error(
      `Order amount exceeds balance(${balance.amount} ${
        paymentMethod.currency
      })`,
    );
  }

  // Making sure the SourcePaymentMethodId is Set(requirement for virtual cards)
  if (!get(paymentMethod, 'SourcePaymentMethodId')) {
    throw new Error(
      'Virtual Card payment method must have a value a "SourcePaymentMethodId" defined',
    );
  }
  // finding Source Payment method and update order payment method properties
  const sourcePaymentMethod = await models.PaymentMethod.findById(
    paymentMethod.SourcePaymentMethodId,
  );
  order.PaymentMethodId = sourcePaymentMethod.id;
  order.paymentMethod = sourcePaymentMethod;
  // finding the payment provider lib to execute the order
  const sourcePaymentMethodProvider = libpayments.findPaymentMethodProvider(
    sourcePaymentMethod,
  );

  // gets the Credit transaction generated
  let creditTransaction = await sourcePaymentMethodProvider.processOrder(order);
  // gets the Debit transaction generated through the TransactionGroup field.
  const updatedTransactions = await models.Transaction.update(
    { PaymentMethodId: paymentMethod.id },
    {
      where: { TransactionGroup: creditTransaction.TransactionGroup },
      returning: true,
    },
  );
  // updating creditTransaction with latest data
  creditTransaction = updatedTransactions[1].filter(
    t => t.type === 'CREDIT',
  )[0];
  return creditTransaction;
}

/** Create Virtual payment method for a collective(organization or user)
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {Number} args.CollectiveId The ID of the organization creating the virtual card.
 * @param {String} args.currency The currency of the card to be created.
 * @param {Number} [args.amount] The total amount that will be
 *  credited to the newly created payment method.
 * @param {Number} [args.monthlyLimitPerMember] Limit for the value of
 *  the card that can be used per month in cents.
 * @param {String} [args.description] The description of the new payment
 *  method.
 * @param {Number} [args.PaymentMethodId] The ID of the Source Payment method the
 *                 organization wants to use
 * @param {Date} [args.expiryDate] The expiry date of the payment method
 * @param {[limitedToTags]} [args.limitedToTags] Limit this payment method to donate to collectives having those tags
 * @param {[limitedToCollectiveIds]} [args.limitedToCollectiveIds] Limit this payment method to those collective ids
 * @param {[limitedToHostCollectiveIds]} [args.limitedToHostCollectiveIds] Limit this payment method to collectives hosted by those collective ids
 * @returns {models.PaymentMethod + code} return the virtual card payment method with
            an extra property "code" that is basically the last 8 digits of the UUID
 */
async function create(args, remoteUser) {
  const collective = await models.Collective.findById(args.CollectiveId);
  let SourcePaymentMethodId = args.PaymentMethodId;
  let sourcePaymentMethod;
  if (!args.PaymentMethodId) {
    sourcePaymentMethod = await collective.getPaymentMethod(
      {
        service: 'stripe',
        type: 'creditcard',
      },
      false,
    );
    if (!sourcePaymentMethod) {
      throw Error(
        `Collective id ${
          collective.id
        } needs to have a credit card to create virtual cards.`,
      );
    }
    SourcePaymentMethodId = sourcePaymentMethod.id;
  }
  const expiryDate = args.expiryDate
    ? moment(args.expiryDate).format()
    : moment()
        .add(3, 'months')
        .format();
  // If monthlyLimitPerMember is defined, we ignore the amount field and
  // consider monthlyLimitPerMember times the months from now until the expiry date
  let monthlyLimitPerMember;
  let amount = args.amount;
  let description = `${formatCurrency(amount, args.currency)} card from ${collective.name}`;
  if (args.monthlyLimitPerMember) {
    monthlyLimitPerMember = args.monthlyLimitPerMember;
    const monthsFromNowToExpiryDate = Math.round(moment(expiryDate).diff(moment(), 'months', true));
    amount = Math.round(monthlyLimitPerMember * monthsFromNowToExpiryDate);
    description = `${formatCurrency(args. monthlyLimitPerMember, args.currency)} monthly card from ${collective.name}`;
  }

  // creates a new Virtual card Payment method
  const paymentMethod = await models.PaymentMethod.create({
    CreatedByUserId: remoteUser && remoteUser.id,
    name: description,
    description: args.description || description,
    initialBalance: amount,
    monthlyLimitPerMember: monthlyLimitPerMember,
    currency: args.currency,
    CollectiveId: args.CollectiveId,
    expiryDate: expiryDate,
    limitedToTags: args.limitedToTags,
    limitedToCollectiveIds: args.limitedToCollectiveIds,
    limitedToHostCollectiveIds: args.limitedToHostCollectiveIds,
    uuid: uuidv4(),
    service: 'opencollective',
    type: 'virtualcard',
    SourcePaymentMethodId: SourcePaymentMethodId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return paymentMethod;
}

/** Claim the Virtual Card Payment Method By an (existing or not) user
 * @param {Object} args contains the parameters
 * @param {String} args.code The 8 last digits of the UUID
 * @param {email} args.user.email The email of the user claiming the virtual card
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
async function claim(args, remoteUser) {
  // validate code
  const virtualCardPaymentMethod = await models.PaymentMethod.findOne({
    where: sequelize.and(
      sequelize.where(sequelize.cast(sequelize.col('uuid'), 'text'), {
        [Op.like]: `${args.code}%`,
      }),
      { service: 'opencollective' },
      { type: 'virtualcard' },
    ),
  });
  if (!virtualCardPaymentMethod) {
    throw Error(`Code "${args.code}" invalid: No virtual card Found`);
  }
  const sourcePaymentMethod = await models.PaymentMethod.findById(
    virtualCardPaymentMethod.SourcePaymentMethodId,
  );
  // if the virtual card PM Collective Id is different than the Source PM Collective Id
  // it means this virtual card was already claimend
  if (!sourcePaymentMethod || sourcePaymentMethod.CollectiveId !== virtualCardPaymentMethod.CollectiveId) {
    throw Error('Virtual card already claimed.');
  }
  // find or creating a user with its collective
  const user = remoteUser || await models.User.findOrCreateByEmail(get(args, 'user.email'), args.user);
  if (!user) {
    throw Error(`Please provide user details or make this request as a logged in user.`);
  }
  // updating virtual card with collective Id of the user
  await virtualCardPaymentMethod.update({
    CollectiveId: user.CollectiveId,
    confirmedAt: new Date(),
  });
  virtualCardPaymentMethod.sourcePaymentMethod = sourcePaymentMethod;
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

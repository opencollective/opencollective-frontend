import models from '../../models';
import roles from '../../constants/roles';
import * as libpayments from '../../lib/payments';
import { TransactionTypes, OC_FEE_PERCENT } from '../../constants/transactions';

/** Get the balance of a giftcard
 *
 * @param {models.PaymentMethod} paymentMethod is the instance of the
 *  giftcard payment method.
 * @return {Object} with amount & currency from the payment method.
 */
export async function getBalance(paymentMethod) {
  if (!libpayments.isProvider('opencollective.giftcard', paymentMethod)) {
    throw new Error(`Expected opencollective.giftcard but got ${paymentMethod.service}.${paymentMethod.type}`);
  }
  return {
    amount: paymentMethod.monthlyLimitPerMember,
    currency: paymentMethod.currency,
  };
}

/** Process a giftcard order
 *
 * 1. use gift card PaymentMethod (PM) to transfer money from gift card
 *    issuer to User;
 * 2. mark original gift card PM as "archivedAt" (it's used up);
 * 3. create new PM type "opencollective" and attach to User (User now
 *    has credit in the system)
 * 4. Use new PM to give money from User to Collective;
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} As any other payment method, after
 *  processing Giftcard orders, the transaction generated from it is
 *  returned.
 */
export async function processOrder(order) {
  const user = order.createdByUser;
  const originalPM = order.paymentMethod;

  let FromCollectiveId = order.paymentMethod.CollectiveId;

  // hacky, HostCollectiveId doesn't quite make sense in this
  // context but required by ledger. TODO: fix later.
  let HostCollectiveId = order.paymentMethod.CollectiveId;

  // If this is a payment method of a host for a specific
  // collective, then we find the collective and its actual
  // host. This is not hacky. The funds were added to this customer
  // id in the host's bank account. We need this association in
  // order to charge the host per transaction.
  if (originalPM.customerId) {
    const fromCollective = await models.Collective.findById(order.FromCollectiveId);
    if (originalPM.customerId === fromCollective.slug) {
      FromCollectiveId = fromCollective.id;
      HostCollectiveId = originalPM.data.HostCollectiveId;
    }
  }

  // Check that target Collective's Host is same as gift card issuer
  const hostCollective = await order.collective.getHostCollective();
  if (hostCollective.id !== HostCollectiveId) {
    throw new Error('Giftcards from other host not allowed');
  }

  // transfer all money using gift card from Host to User
  await models.Transaction.createFromPayload({
    CreatedByUserId: user.id,
    FromCollectiveId,
    CollectiveId: user.CollectiveId,
    PaymentMethodId: order.PaymentMethodId,
    transaction: {
      type: TransactionTypes.CREDIT,
      OrderId: order.id,
      amount: order.paymentMethod.monthlyLimitPerMember, // treating this field as one-time limit
      amountInHostCurrency: order.paymentMethod.monthlyLimitPerMember,
      currency: order.paymentMethod.currency,
      hostCurrency: order.currency, // assuming all USD transactions for now
      hostCurrencyFxRate: 1,
      hostFeeInHostCurrency: 0,
      platformFeeInHostCurrency: 0, // we don't charge a fee until the money is used by User
      paymentProcessorFeeInHostCurrency: 0,
      description: order.paymentMethod.name,
      HostCollectiveId,
    }
  });

  // mark gift card as used, so no one can use it again
  await order.paymentMethod.update({archivedAt: new Date()});

  // create new payment method to allow User to use the money
  const newPaymentMethod = await models.PaymentMethod.create({
    name: originalPM.name,
    service: 'opencollective',
    type: 'collective', // changes to type collective
    confirmedAt: new Date(),
    CollectiveId: user.CollectiveId,
    CreatedByUserId: user.id,
    MonthlyLimitPerMember: originalPM.monthlyLimitPerMember,
    currency: originalPM.currency,
    token: null // we don't pass the gift card token on
  });

  // Use the above payment method to donate to Collective
  const hostFeeInHostCurrency = libpayments.calcFee(
    order.totalAmount,
    order.collective.hostFeePercent);
  const platformFeeInHostCurrency = libpayments.calcFee(
    order.totalAmount, OC_FEE_PERCENT);
  const transactions = await models.Transaction.createFromPayload({
    CreatedByUserId: user.id,
    FromCollectiveId: order.FromCollectiveId,
    CollectiveId: order.CollectiveId,
    PaymentMethodId: newPaymentMethod.id,
    transaction: {
      type: TransactionTypes.CREDIT,
      OrderId: order.id,
      amount: order.totalAmount,
      amountInHostCurrency: order.totalAmount,
      currency: order.currency,
      hostCurrency: order.currency,
      hostCurrencyFxRate: 1,
      hostFeeInHostCurrency,
      platformFeeInHostCurrency,
      paymentProcessorFeeInHostCurrency: 0,
      description: order.description
    }
  });

  // add roles
  await order.collective.findOrAddUserWithRole({ id: user.id, CollectiveId: order.fromCollective.id}, roles.BACKER, {
    CreatedByUserId: user.id, TierId: order.TierId,
  });

  // Mark order row as processed
  await order.update({ processedAt: new Date() });

  // Mark paymentMethod as confirmed
  newPaymentMethod.update({ confirmedAt: new Date() });

  return transactions;
}

/* Expected API of a Payment Method Type */
export default {
  features: {
    recurring: true,
    waitToCharge: false
  },
  getBalance,
  processOrder,
};

/*  -- Giftcard Generation -- */

const VERIFICATION_MODULO = 45797;

/** Generate random string to be used in a Giftcard token */
export function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/** Generate the verification number of a token */
export function getVerificationNumber(str) {
  const data = Array.prototype.map
    .call(str, c => c.charCodeAt(0))
    .reduce((a, b) => a * b) % VERIFICATION_MODULO;
  return data.toString().substr(-1);
}

/** Generate a new token for a gift card */
export function newToken(prefix) {
  // generate three letters (ignoring confusing ones)
  const letters = randomString(3, 'ACEFHJKLMNPRSTUVWXY');
  // generate three digit number
  const numbers = randomString(3, '123456789');
  // generate verification number
  const code = `${prefix}${letters}${numbers}`;
  const verification = getVerificationNumber(code);

  if (letters.length !== 3 || numbers.toString().length != 3 || verification.toString().length !== 1) {
    throw new Error('Incorrect length found', letters, numbers, verification);
  }
  return `${code}${verification}`;
}

/** Create the data for batches of giftcards */
export function createGiftcardData(batches, opts) {
  const {
    name,
    CollectiveId,
    CreatedByUserId,
    monthlyLimitPerMember,
    currency,
  } = opts;

  // Prefix for the token strings
  const prefix = name[0].toUpperCase().repeat(2);

  const cardList = [];

  batches.forEach(batch => {
    for (let i = 0; i < batch.count; i++) {
      const token = newToken(prefix);
      cardList.push({
        name,
        token,
        currency,
        monthlyLimitPerMember, // overloading to serve as prepaid amount
        expiryDate: batch.expiryDate,
        CreatedByUserId,
        CollectiveId,
        service: 'opencollective',
        type: 'giftcard',
      });
    }
  });
  return cardList;
}

/** Generate Giftcards in batches
 *
 * @param {Object[]} batches Array of objects containing the number of
 *  cards and expiry date of each batch.
 * @param {Object} opts Configure how the giftcards should be created
 * @param {String} opts.name Name of the giftcard. The first letter of
 *  the name is also used as the prefix of the card.
 * @param {Number} opts.CreatedByUserId user id of the creator or the
 *  admin of the collective funding gift cards.
 * @param {Number} opts.CollectiveId issuer's collective ID.
 * @param {Number} opts.monthlyLimitPerMember Limit for the value of
 *  the card that can be used per month in cents.
 * @param {String} opts.currency Currency of the giftcard.
 */
export async function createGiftcards(batches, opts) {
  const data = createGiftcardData(batches, opts);
  return models.PaymentMethod.bulkCreate(data);
}

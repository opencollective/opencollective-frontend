import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { get, times, isEmpty } from 'lodash';
import config from 'config';
import sanitize from 'sanitize-html';

import models, { Op, sequelize } from '../../models';
import * as libpayments from '../../lib/payments';
import * as currency from '../../lib/currency';
import { formatCurrency, isValidEmail } from '../../lib/utils';
import emailLib from '../../lib/email';
import cache from '../../lib/cache';
import { ValidationFailed } from '../../graphql/errors';

/**
 * Virtual Card Payment method - This payment Method works basically as an alias
 * to other Payment method(field "SourcePaymentMethodId") that will create transactions
 * and then the payment methods of those transactions will be replaced by
 * the virtual card payment method that first processed the order.
 */

const LIMIT_REACHED_ERROR =
  'Gift card create failed because you reached limit. Please try again later or contact support@opencollective.com';

/** Get the balance of a virtual card card
 * @param {models.PaymentMethod} paymentMethod is the instance of the
 *  virtual card payment method.
 * @return {Object} with amount & currency from the payment method.
 */
async function getBalance(paymentMethod) {
  if (!libpayments.isProvider('opencollective.virtualcard', paymentMethod)) {
    throw new Error(`Expected opencollective.virtualcard but got ${paymentMethod.service}.${paymentMethod.type}`);
  }
  let query = {
    PaymentMethodId: paymentMethod.id,
    type: 'DEBIT',
    RefundTransactionId: null,
  };
  let initialBalance = paymentMethod.initialBalance;
  if (paymentMethod.monthlyLimitPerMember) {
    // consider initial balance as monthly limit
    initialBalance = paymentMethod.monthlyLimitPerMember;
    // find first and last days of current month(first and last ms of those days)
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    // update query to filter result through the dates
    query = { ...query, createdAt: { [Op.between]: [firstDay, lastDay] } };
  }
  /* Result will be negative (We're looking for DEBIT transactions) */
  const allTransactions = await models.Transaction.findAll({
    attributes: ['netAmountInCollectiveCurrency', 'currency'],
    where: query,
  });
  let spent = 0;
  for (const transaction of allTransactions) {
    if (transaction.currency != paymentMethod.currency) {
      const fxRate = await currency.getFxRate(transaction.currency, paymentMethod.currency);
      spent += transaction.netAmountInCollectiveCurrency * fxRate;
    } else {
      spent += transaction.netAmountInCollectiveCurrency;
    }
  }
  const balance = {
    amount: Math.round(initialBalance + spent),
    currency: paymentMethod.currency,
  };
  return balance;
}

/** Process a virtual card order
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} the double entry generated transactions.
 */
async function processOrder(order) {
  const paymentMethod = await models.PaymentMethod.findByPk(order.paymentMethod.id);
  // check if payment Method has expired
  if (!paymentMethod.expiryDate || moment(paymentMethod.expiryDate) < moment()) {
    throw new Error('Payment method has already expired');
  }

  // Checking if balance is ok or will still be after completing the order
  const balance = await getBalance(paymentMethod);
  if (!balance || balance.amount <= 0) {
    throw new Error('This payment method has no balance to complete this order');
  }
  // converting(or keeping if it's the same currency) order amount to the payment method currency
  let orderAmountInPaymentMethodCurrency = order.totalAmount;
  if (order.currency != paymentMethod.currency) {
    const fxRate = await currency.getFxRate(order.currency, paymentMethod.currency);
    orderAmountInPaymentMethodCurrency = order.totalAmount * fxRate;
  }
  if (balance.amount - orderAmountInPaymentMethodCurrency < 0) {
    throw new Error(`Order amount exceeds balance(${balance.amount} ${paymentMethod.currency})`);
  }

  // Making sure the SourcePaymentMethodId is Set(requirement for virtual cards)
  if (!get(paymentMethod, 'SourcePaymentMethodId')) {
    throw new Error('Gift Card payment method must have a value a "SourcePaymentMethodId" defined');
  }
  // finding Source Payment method and update order payment method properties
  const sourcePaymentMethod = await models.PaymentMethod.findByPk(paymentMethod.SourcePaymentMethodId);

  // finding the payment provider lib to execute the order
  const sourcePaymentMethodProvider = libpayments.findPaymentMethodProvider(sourcePaymentMethod);

  let creditTransaction = null;
  try {
    // modifying original order to then process the order of the source payment method
    order.PaymentMethodId = sourcePaymentMethod.id;
    order.paymentMethod = sourcePaymentMethod;
    // gets the Credit transaction generated
    creditTransaction = await sourcePaymentMethodProvider.processOrder(order);
  } finally {
    // undo modification of original order after processing the source payment method order
    await order.update({ PaymentMethodId: paymentMethod.id });
    order.PaymentMethodId = paymentMethod.id;
    order.paymentMethod = paymentMethod;
  }

  // gets the Debit transaction generated through the TransactionGroup field.
  const updatedTransactions = await models.Transaction.update(
    {
      PaymentMethodId: paymentMethod.id,
      UsingVirtualCardFromCollectiveId: sourcePaymentMethod.CollectiveId,
    },
    {
      where: { TransactionGroup: creditTransaction.TransactionGroup },
      returning: true,
    },
  );
  // updating creditTransaction with latest data
  creditTransaction = updatedTransactions[1].filter(t => t.type === 'CREDIT')[0];
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
 * @param {boolean} sendEmailAsync if true, emails will be sent in background
 *  and we won't check if it has properly been sent to confirm
 * @returns {models.PaymentMethod + code} return the virtual card payment method with
            an extra property "code" that is basically the last 8 digits of the UUID
 */
async function create(args, remoteUser) {
  const totalAmount = args.amount || args.monthlyLimitPerMember;
  const collective = await models.Collective.findByPk(args.CollectiveId);
  if (!collective) {
    throw new Error('Collective does not exist');
  } else if (!(await checkCreateLimit(collective, 1, totalAmount))) {
    throw new Error(LIMIT_REACHED_ERROR);
  }

  // Load source payment method, ensure there is enough funds on it
  const sourcePaymentMethod = await getSourcePaymentMethodFromCreateArgs(args, collective);
  const virtualCardCurrency = getCurrencyFromCreateArgs(args, collective);
  await checkSourcePaymentMethodBalance(sourcePaymentMethod, totalAmount, virtualCardCurrency);

  const createParams = getCreateParams(args, collective, sourcePaymentMethod, remoteUser);
  const virtualCard = await models.PaymentMethod.create(createParams);
  sendVirtualCardCreatedEmail(virtualCard, collective);
  registerCreateInCache(args.CollectiveId, 1, totalAmount);
  return virtualCard;
}

/**
 * Bulk create virtual cards from a `count`. Doesn't send emails, please use
 * `createForEmails` if you need to.
 *
 * @param {object} args
 * @param {object} remoteUser
 * @param {integer} count
 */
export async function bulkCreateVirtualCards(args, remoteUser, count) {
  if (!count) {
    return [];
  }

  // Check rate limit
  const totalAmount = (args.amount || args.monthlyLimitPerMember) * count;
  const collective = await models.Collective.findByPk(args.CollectiveId);
  if (!collective) {
    throw new Error('Collective does not exist');
  } else if (!(await checkCreateLimit(collective, count, totalAmount))) {
    throw new Error(LIMIT_REACHED_ERROR);
  }

  // Load source payment method, ensure there is enough funds on it
  const sourcePaymentMethod = await getSourcePaymentMethodFromCreateArgs(args, collective);
  const virtualCardCurrency = getCurrencyFromCreateArgs(args, collective);
  await checkSourcePaymentMethodBalance(sourcePaymentMethod, totalAmount, virtualCardCurrency);

  const virtualCardsParams = times(count, () => {
    return getCreateParams(args, collective, sourcePaymentMethod, remoteUser);
  });
  const virtualCards = await models.PaymentMethod.bulkCreate(virtualCardsParams);
  registerCreateInCache(args.CollectiveId, virtualCards.length, totalAmount);
  return virtualCards;
}

/**
 * Bulk create virtual cards from a list of emails.
 *
 * @param {object} args
 * @param {object} remoteUser
 * @param {integer} count
 * @param {string} customMessage A message that will be sent in the invitation email
 */
export async function createVirtualCardsForEmails(args, remoteUser, emails, customMessage) {
  if (emails.length === 0) {
    return [];
  }
  // Check rate limit
  const totalAmount = (args.amount || args.monthlyLimitPerMember) * emails.length;
  const collective = await models.Collective.findByPk(args.CollectiveId);
  if (!collective) {
    throw new Error('Collective does not exist');
  } else if (!(await checkCreateLimit(collective, emails.length, totalAmount))) {
    throw new Error(LIMIT_REACHED_ERROR);
  }

  // Load source payment method, ensure there is enough funds on it
  const sourcePaymentMethod = await getSourcePaymentMethodFromCreateArgs(args, collective);
  const virtualCardCurrency = getCurrencyFromCreateArgs(args, collective);
  await checkSourcePaymentMethodBalance(sourcePaymentMethod, totalAmount, virtualCardCurrency);

  const virtualCardsParams = emails.map(email => {
    const createArgs = { ...args, data: { email, customMessage } };
    return getCreateParams(createArgs, collective, sourcePaymentMethod, remoteUser);
  });
  const virtualCards = models.PaymentMethod.bulkCreate(virtualCardsParams);
  virtualCards.map(vc => sendVirtualCardCreatedEmail(vc, collective));
  registerCreateInCache(args.CollectiveId, virtualCards.length, totalAmount);
  return virtualCards;
}

/**
 * Get a payment method from args or returns collective default payment method
 * if none has been provided. Will throw if collective doesn't have any payment
 * method attached.
 *
 * @param {object} args
 * @param {object} remoteUser
 */
async function getSourcePaymentMethodFromCreateArgs(args, collective) {
  let paymentMethod = null;
  if (!args.PaymentMethodId) {
    paymentMethod = await collective.getPaymentMethod({ service: 'stripe', type: 'creditcard' }, false);
    if (!paymentMethod) {
      throw Error(`Collective id ${collective.id} needs to have a Credit Card attached to create Gift Cards.`);
    }
  } else {
    paymentMethod = await models.PaymentMethod.findByPk(args.PaymentMethodId);
    if (!paymentMethod || paymentMethod.CollectiveId !== collective.id) {
      throw Error('Invalid PaymentMethodId');
    }
  }
  return paymentMethod;
}

/**
 * Ensure `paymentMethod` has at least `amount` as balance, throw if it hasn't.
 *
 * @param {PaymentMethod} paymentMethod
 * @param {Integer} amount
 */
async function checkSourcePaymentMethodBalance(paymentMethod, amount, virtualCardCurrency) {
  // Load balance
  const paymentProvider = libpayments.findPaymentMethodProvider(paymentMethod);
  let balance = 0;
  if (paymentProvider && paymentProvider.getBalance) {
    balance = await paymentProvider.getBalance(paymentMethod);
  } else {
    // PM doesn't have any limit, we can continue safely
    return;
  }

  // Convert amounts if not the same currency
  const fxrate = await currency.getFxRate(virtualCardCurrency, balance.currency);
  const totalAmountInPaymentMethodCurrency = amount * fxrate;

  // Check balance
  if (totalAmountInPaymentMethodCurrency > balance.amount) {
    const currentBalanceDetails = `Current balance is ${formatCurrency(balance.amount, balance.currency)}`;
    throw new Error(`There is not enough funds on this PaymentMethod. ${currentBalanceDetails}`);
  }

  // Total virtual cards sum cannot be more than the initial balance
  const existingTotal = await paymentMethod.getChildrenPMTotalSum();
  if (existingTotal + totalAmountInPaymentMethodCurrency > paymentMethod.initialBalance) {
    const initialBalanceStr = formatCurrency(paymentMethod.initialBalance, paymentMethod.currency);
    const alreadyCreatedAmountStr = formatCurrency(existingTotal, balance.currency);
    const currentBalanceDetails = `Initial balance is ${initialBalanceStr}`;
    const alreadyCreatedDetails = `you have already created ${alreadyCreatedAmountStr} worth of gift cards`;
    throw new Error(
      `There is not enough funds on this PaymentMethod for new gift cards. ${currentBalanceDetails} and ${alreadyCreatedDetails}.`,
    );
  }
}

/** Get currency from args, or returns default currency. Throws if currency is invalid */
function getCurrencyFromCreateArgs(args, collective) {
  // Make sure currency is a string, trim and uppercase it.
  const currency = args.currency ? args.currency.toString().toUpperCase() : collective.currency;
  if (!['USD', 'EUR'].includes(currency)) {
    throw new Error(`Currency ${currency} not supported. We only support USD and EUR at the moment.`);
  }
  return currency;
}

/**
 * Get a PaymentMethod object representing the VirtualCard to be created. Will
 * throw if given invalid args.
 *
 * @param {object} args
 * @param {object} remoteUser
 * @param {object} collective
 * @param {object} sourcePaymentMethod
 */
function getCreateParams(args, collective, sourcePaymentMethod, remoteUser) {
  // Make sure user is admin of collective
  if (!remoteUser.isAdmin(collective.id)) {
    throw new Error('User must be admin of collective');
  }

  // Make sure currency is a string, trim and uppercase it.
  args.currency = getCurrencyFromCreateArgs(args, collective);

  // Ensure sourcePaymentMethod type is supported
  if (!['creditcard', 'prepaid'].includes(sourcePaymentMethod.type)) {
    throw new Error('Only prepaid and creditcard can be used as gift cards source payment methods');
  }

  // Ensure amount or monthlyLimitPerMember are valid
  if (!args.amount && !args.monthlyLimitPerMember) {
    throw Error('you need to define either the amount or the monthlyLimitPerMember of the payment method.');
  } else if (args.amount && args.amount < 5) {
    throw Error('Min amount for gift card is $5');
  } else if (args.monthlyLimitPerMember && args.monthlyLimitPerMember < 5) {
    throw Error('Min monthly limit per member for gift card is $5');
  }

  // Set a default expirity date to 2 years by default
  const expiryDate = args.expiryDate
    ? moment(args.expiryDate).format()
    : moment()
        .add(24, 'months')
        .format();

  // If monthlyLimitPerMember is defined, we ignore the amount field and
  // consider monthlyLimitPerMember times the months from now until the expiry date
  let monthlyLimitPerMember;
  let amount = args.amount;
  let description = `${formatCurrency(amount, args.currency)} Gift Card from ${collective.name}`;
  if (args.monthlyLimitPerMember) {
    monthlyLimitPerMember = args.monthlyLimitPerMember;
    amount = null;
    description = `${formatCurrency(args.monthlyLimitPerMember, args.currency)} Monthly Gift Card from ${
      collective.name
    }`;
  }

  // Whitelist fields for `data`
  let data = {};
  if (args.data) {
    // Email
    if (args.data.email) {
      if (!isValidEmail(args.data.email)) {
        throw new Error(`Invalid email address: ${args.data.email}`);
      }
      data.email = args.data.email;
    }
    // Custom message
    if (args.data.customMessage) {
      const customMessage = sanitize(args.data.customMessage.trim(), {
        allowedTags: [],
        allowedAttributes: {},
      });

      if (customMessage.length > 255) {
        throw new Error('Custom message must be 255 characters max');
      } else if (customMessage.length > 0) {
        data.customMessage = customMessage;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    data = null;
  }

  // Build the virtualcard object
  return {
    CreatedByUserId: remoteUser.id,
    SourcePaymentMethodId: sourcePaymentMethod.id,
    name: description,
    description: args.description || description,
    initialBalance: amount,
    monthlyLimitPerMember: monthlyLimitPerMember,
    currency: args.currency,
    CollectiveId: args.CollectiveId,
    expiryDate: expiryDate,
    limitedToTags: args.limitedToTags,
    limitedToCollectiveIds: isEmpty(args.limitedToCollectiveIds) ? null : args.limitedToCollectiveIds,
    limitedToHostCollectiveIds: isEmpty(args.limitedToHostCollectiveIds) ? null : args.limitedToHostCollectiveIds,
    uuid: uuid(),
    service: 'opencollective',
    type: 'virtualcard',
    createdAt: new Date(),
    updatedAt: new Date(),
    batch: args.batch,
    data,
  };
}

/**
 * Send an email with the virtual card redeem URL to the user.
 *
 * @param {object} virtualCard
 */
async function sendVirtualCardCreatedEmail(virtualCard, emitterCollective) {
  const code = virtualCard.uuid.split('-')[0];
  const email = get(virtualCard, 'data.email');

  if (!email) {
    return false;
  }

  return emailLib.send('user.card.invited', email, {
    email,
    redeemCode: code,
    initialBalance: virtualCard.initialBalance,
    expiryDate: virtualCard.expiryDate,
    name: virtualCard.name,
    currency: virtualCard.currency,
    emitter: emitterCollective,
    customMessage: get(virtualCard, 'data.customMessage', ''),
  });
}

/** Claim the Virtual Card Payment Method By an (existing or not) user
 * @param {Object} args contains the parameters
 * @param {String} args.code The 8 last digits of the UUID
 * @param {email} args.user.email The email of the user claiming the virtual card
 * @returns {models.PaymentMethod} return the virtual card payment method.
 */
async function claim(args, remoteUser) {
  // Validate code format
  const redeemCodeRegex = /^[a-zA-Z0-9]{8}$/;
  if (!redeemCodeRegex.test(args.code)) {
    throw Error(`Gift Card code "${args.code}" has invalid format`);
  }

  // Get code from DB
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
    throw Error(`Gift Card code "${args.code}" is invalid`);
  }
  const sourcePaymentMethod = await models.PaymentMethod.findByPk(virtualCardPaymentMethod.SourcePaymentMethodId);
  // if the virtual card PM Collective Id is different than the Source PM Collective Id
  // it means this virtual card was already claimend
  if (!sourcePaymentMethod || sourcePaymentMethod.CollectiveId !== virtualCardPaymentMethod.CollectiveId) {
    throw Error('Gift Card already redeemed');
  } else if (virtualCardPaymentMethod.expiryDate < new Date()) {
    throw new ValidationFailed({ message: `This gift card has expired` });
  }

  // find or creating a user with its collective
  // if user is created, this will NOT send a registration email
  const user = remoteUser || (await models.User.findOrCreateByEmail(get(args, 'user.email'), args.user));
  if (!user) {
    throw Error('Please provide user details or make this request as a logged in user.');
  }
  // updating virtual card with collective Id of the user
  await virtualCardPaymentMethod.update({
    CollectiveId: user.CollectiveId,
    confirmedAt: new Date(),
  });
  virtualCardPaymentMethod.sourcePaymentMethod = sourcePaymentMethod;
  return virtualCardPaymentMethod;
}

function createCountCacheKey(collectiveId) {
  return `virtualcards_count_limit_on_collective_${collectiveId}`;
}

function createAmountCacheKey(collectiveId) {
  return `virtualcards_amount_limit_on_collective_${collectiveId}`;
}

/** Return false if create limits have been reached */
async function checkCreateLimit(collective, count, amount) {
  const limitFromSettings = type => get(collective, `settings.virtualCardsMaxDaily${type}`);
  const limitPerDay = limitFromSettings('Count') || config.limits.virtualCards.maxPerDay;
  const limitAmountPerDay = limitFromSettings('Amount') || config.limits.virtualCards.maxAmountPerDay;

  // Check count
  const countCacheKey = createCountCacheKey(collective.id);
  const existingCount = (await cache.get(countCacheKey)) || 0;
  if (existingCount + count > limitPerDay) {
    return false;
  }

  // Check amount
  const amountCacheKey = createAmountCacheKey(collective.id);
  const existingAmount = (await cache.get(amountCacheKey)) || 0;
  if (existingAmount + amount > limitAmountPerDay) {
    return false;
  }

  return true;
}

/** `checkCreateLimit`'s best friend - register `count` create actions in cache */
async function registerCreateInCache(collectiveId, count, amount) {
  const oneDayInSeconds = 24 * 60 * 60;

  // Set count cache
  const countCacheKey = createCountCacheKey(collectiveId);
  const existingCount = (await cache.get(countCacheKey)) || 0;
  cache.set(countCacheKey, existingCount + count, oneDayInSeconds);

  // Set amount cache
  const amountCacheKey = createAmountCacheKey(collectiveId);
  const existingAmount = (await cache.get(amountCacheKey)) || 0;
  cache.set(amountCacheKey, existingAmount + amount, oneDayInSeconds);
}

async function refundTransaction(transaction, user) {
  /* Create negative transactions for the received transaction */
  const refundTransaction = await libpayments.createRefundTransaction(transaction, 0, null, user);

  /* Associate RefundTransactionId to all the transactions created */
  return libpayments.associateTransactionRefundId(transaction, refundTransaction);
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
  refundTransaction,
};

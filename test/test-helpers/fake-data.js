// We often use `utils.data` (ie. utils.data('collective1')) in the code to generate test
// data. This approach is enough in certain cases but it has flows:
// - Collectives with unique colomns (slugs) cannot be created without reseting the DB
// - No randomness in produced values
//
// This lib is a superset of `utils.data` that generates values that are random and safe
// to use in loops and repeted tests.

import uuid from 'uuid/v4';
import { get, sample } from 'lodash';
import models from '../../server/models';
import { types as CollectiveType } from '../../server/constants/collectives';
import { randEmail, randUrl } from '../stores';
import { PayoutMethodTypes } from '../../server/models/PayoutMethod';
import { roles } from '../../server/constants';

export const randStr = (prefix = '') => `${prefix}${uuid().split('-')[0]}`;
export const randNumber = (min = 0, max = 10000000) => Math.floor(Math.random() * max) + min;
export const randAmount = (min = 100, max = 10000000) => randNumber(min, max);
export const multiple = (fn, n, args) => Promise.all([...Array(n).keys()].map(() => fn(args)));

/** Generate an array containing between min and max item, filled with generateFunc */
export const randArray = (generateFunc, min = 1, max = 1) => {
  const arrayLength = randNumber(min, max);
  return [...Array(arrayLength)].map((_, idx) => generateFunc(idx, arrayLength));
};

/**
 * Creates a fake user. All params are optionals.
 */
export const fakeUser = async userData => {
  const user = await models.User.create({
    email: randEmail(),
    firstName: randStr('FirstName '),
    lastName: randStr('LastName '),
    ...userData,
  });

  const userCollective = await fakeCollective({
    type: 'USER',
    name: randStr('User Name'),
    slug: randStr('user-'),
    data: { UserId: user.id },
    HostCollectiveId: null,
    CreatedByUserId: user.id,
  });

  await user.update({ CollectiveId: userCollective.id });
  user.collective = userCollective;
  return user;
};

/** Create a fake host */
export const fakeHost = async hostData => {
  return fakeCollective({
    type: CollectiveType.ORGANIZATION,
    name: randStr('Test Host '),
    slug: randStr('host-'),
    HostCollectiveId: null,
    isHostAccount: true,
    ...hostData,
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeCollective = async (collectiveData = {}) => {
  const type = collectiveData.type || CollectiveType.COLLECTIVE;
  const collective = await models.Collective.create({
    type,
    name: randStr('Test Collective '),
    slug: randStr('collective-'),
    description: randStr('Description '),
    currency: 'USD',
    twitterHandle: randStr('twitter'),
    website: randUrl(),
    hostFeePercent: 10,
    tags: [randStr(), randStr()],
    isActive: true,
    ...collectiveData,
    CreatedByUserId: collectiveData.CreatedByUserId || (await fakeUser()).id,
    HostCollectiveId:
      collectiveData.HostCollectiveId === undefined ? (await fakeHost()).id : collectiveData.HostCollectiveId,
  });

  collective.host = collective.HostCollectiveId && (await models.Collective.findByPk(collective.HostCollectiveId));
  if (collective.host) {
    try {
      await models.Member.create({
        CollectiveId: collective.id,
        MemberCollectiveId: collective.host.id,
        role: roles.HOST,
        CreatedByUserId: collective.CreatedByUserId,
      });
    } catch {
      // Ignore if host is already linked
    }
  }

  return collective;
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeEvent = async (collectiveData = {}) => {
  const ParentCollectiveId = collectiveData.ParentCollectiveId || (await fakeCollective()).id;
  const parentCollective = await models.Collective.findByPk(ParentCollectiveId);
  return fakeCollective({
    name: randStr('Test Event '),
    slug: randStr('event-'),
    ...collectiveData,
    type: 'EVENT',
    ParentCollectiveId: ParentCollectiveId,
    HostCollectiveId: parentCollective.HostCollectiveId,
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeUpdate = async (updateData = {}) => {
  return models.Update.create({
    slug: randStr('update-'),
    title: randStr('Update '),
    html: '<div><strong>Hello</strong> Test!</div>',
    ...updateData,
    FromCollectiveId: updateData.FromCollectiveId || (await fakeCollective()).id,
    CollectiveId: updateData.CollectiveId || (await fakeCollective()).id,
    CreatedByUserId: updateData.CreatedByUserId || (await fakeUser()).id,
  });
};

/**
 * Creates a fake expense attachment
 */
export const fakeExpenseAttachment = async (attachmentData = {}) => {
  return models.ExpenseAttachment.create({
    amount: randAmount(),
    url: `${randUrl()}.pdf`,
    description: randStr(),
    ...attachmentData,
    ExpenseId: attachmentData.ExpenseId || (await fakeExpense({ attachments: [] })).id,
    CreatedByUserId: attachmentData.CreatedByUserId || (await fakeUser()).id,
  });
};

/**
 * Fake a Payout Method (defaults to PayPal)
 */
export const fakePayoutMethod = async (data = {}) => {
  const generateData = type => {
    if (type === PayoutMethodTypes.PAYPAL) {
      return { email: randEmail() };
    } else if (type === PayoutMethodTypes.OTHER) {
      return { content: randStr() };
    } else {
      return null;
    }
  };

  const type = (data && data.type) || PayoutMethodTypes.PAYPAL;
  return models.PayoutMethod.create({
    name: randStr('Fake Payout Method '),
    data: generateData(type),
    ...data,
    type,
    CollectiveId: data.CollectiveId || (await fakeCollective()).id,
    CreatedByUserId: data.CreatedByUserId || (await fakeUser()).id,
  });
};

/**
 * Creates a fake expense. All params are optionals.
 */
export const fakeExpense = async (expenseData = {}) => {
  let PayoutMethodId = expenseData.PayoutMethodId;
  if (expenseData.legacyPayoutMethod && PayoutMethodId) {
    throw new Error('legacyPayoutMethod and PayoutMethodId are exclusive in fakeExpense');
  } else if (expenseData.legacyPayoutMethod) {
    const pm = await fakePayoutMethod({
      type: models.Expense.getPayoutMethodTypeFromLegacy(expenseData.legacyPayoutMethod),
    });
    PayoutMethodId = pm.id;
  } else if (!PayoutMethodId) {
    PayoutMethodId = (await fakePayoutMethod()).id;
  }

  const payoutMethod = await models.PayoutMethod.findByPk(PayoutMethodId);
  const legacyPayoutMethod = models.Expense.getLegacyPayoutMethodTypeFromPayoutMethod(payoutMethod);
  const user = await (expenseData.UserId ? models.User.findByPk(expenseData.UserId) : fakeUser());
  const expense = await models.Expense.create({
    amount: randAmount(),
    currency: 'USD',
    category: 'Engineering',
    description: randStr('Test expense '),
    incurredAt: new Date(),
    ...expenseData,
    FromCollectiveId: expenseData.FromCollectiveId || user.CollectiveId,
    CollectiveId: expenseData.CollectiveId || (await fakeCollective()).id,
    UserId: user.id,
    lastEditedById: expenseData.lastEditedById || user.id,
    PayoutMethodId,
    legacyPayoutMethod,
  });

  if (!expenseData || typeof expenseData.attachments === 'undefined') {
    // Helper to generate an attachment. Ensures that attachments match expense amount
    const generateAttachment = (idx, nbItems) => {
      const baseAmount = Math.floor(expense.amount / nbItems);
      const remainder = expense.amount % nbItems;
      const realAmount = idx !== nbItems - 1 ? baseAmount : baseAmount + remainder;
      return fakeExpenseAttachment({ ExpenseId: expense.id, amount: realAmount });
    };

    expense.attachments = await Promise.all(randArray(generateAttachment, 1, 5));
  }

  expense.User = await models.User.findByPk(expense.UserId);
  return expense;
};

/**
 * Creates a fake comment. All params are optionals.
 */
export const fakeComment = async commentData => {
  let FromCollectiveId = get(commentData, 'FromCollectiveId') || get(commentData, 'fromCollective.id');
  let CollectiveId = get(commentData, 'CollectiveId') || get(commentData, 'collective.id');
  let CreatedByUserId = get(commentData, 'CreatedByUserId') || get(commentData, 'createdByUser.id');
  let ExpenseId = get(commentData, 'ExpenseId') || get(commentData, 'expense.id');
  const ConversationId = get(commentData, 'ConversationId') || get(commentData, 'conversation.id');
  if (!FromCollectiveId) {
    FromCollectiveId = (await fakeCollective()).id;
  }
  if (!CollectiveId) {
    CollectiveId = (await fakeCollective()).id;
  }
  if (!CreatedByUserId) {
    CreatedByUserId = (await fakeUser()).id;
  }
  if (!ExpenseId && !ConversationId) {
    ExpenseId = (await fakeExpense()).id;
  }

  return models.Comment.create({
    html: '<div><strong>Hello</strong> Test comment!</div>',
    ...commentData,
    FromCollectiveId,
    CollectiveId,
    CreatedByUserId,
    ExpenseId,
    ConversationId,
  });
};

/**
 * Creates a fake tier. All params are optionals.
 */
export const fakeTier = async (tierData = {}) => {
  const name = randStr('tier');
  const interval = sample(['month', 'year']);
  const currency = sample(['USD', 'EUR']);
  const amount = tierData.amount || randAmount(1, 100) * 100;
  const description = `$${amount / 100}/${interval}`;

  return models.Tier.create({
    name,
    type: 'TIER',
    slug: name,
    description,
    amount,
    interval,
    currency,
    maxQuantity: randAmount(),
    ...tierData,
  });
};

/**
 * Creates a fake order. All params are optionals.
 */
export const fakeOrder = async (orderData = {}) => {
  const CreatedByUserId = orderData.CreatedByUserId || (await fakeUser()).id;
  const user = await models.User.findByPk(CreatedByUserId);
  const FromCollectiveId = orderData.FromCollectiveId || (await models.Collective.findByPk(user.CollectiveId)).id;
  const CollectiveId = orderData.CollectiveId || (await fakeCollective()).id;
  const collective = await models.Collective.findByPk(CollectiveId);

  const order = await models.Order.create({
    quantity: 1,
    currency: collective.currency,
    totalAmount: randAmount(100, 99999999),
    ...orderData,
    CreatedByUserId,
    FromCollectiveId,
    CollectiveId,
  });

  if (order.PaymentMethodId) {
    order.paymentMethod = await models.PaymentMethod.findByPk(order.PaymentMethodId);
  }

  order.fromCollective = await models.Collective.findByPk(order.FromCollectiveId);
  order.collective = collective;
  order.createdByUser = user;
  return order;
};

/**
 * Creates a fake connectedAccount. All params are optionals.
 */
export const fakeConnectedAccount = async (connectedAccountData = {}) => {
  const CollectiveId = connectedAccountData.CollectiveId || (await fakeCollective()).id;
  const service = sample(['github', 'twitter', 'stripe', 'transferwise']);

  return models.ConnectedAccount.create({
    service,
    ...connectedAccountData,
    CollectiveId,
  });
};

/**
 * Creates a fake transaction. All params are optionals.
 */
export const fakeTransaction = async (transactionData = {}) => {
  const amount = transactionData.amount || randAmount(10, 100) * 100;
  const CreatedByUserId = transactionData.CreatedByUserId || (await fakeUser()).id;
  const FromCollectiveId = transactionData.FromCollectiveId || (await fakeCollective()).id;
  const CollectiveId = transactionData.CollectiveId || (await fakeCollective()).id;
  return models.Transaction.create({
    type: amount < 0 ? 'DEBIT' : 'CREDIT',
    currency: 'USD',
    hostCurrency: 'USD',
    hostCurrencyFxRate: 1,
    netAmountInCollectiveCurrency: amount,
    amountInHostCurrency: amount,
    ...transactionData,
    amount,
    CreatedByUserId,
    FromCollectiveId,
    CollectiveId,
  });
};

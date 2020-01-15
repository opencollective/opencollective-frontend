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

export const randStr = (prefix = '') => `${prefix}${uuid().split('-')[0]}`;
export const randNumber = (min = 0, max = 10000000) => Math.floor(Math.random() * max) + min;
export const randAmount = (min = 100, max = 10000000) => randNumber(min, max);
export const multiple = (fn, n, args) => Promise.all([...Array(n).keys()].map(() => fn(args)));

/** Generate an array containing between min and max item, filled with generateFunc */
export const randArray = (generateFunc, min = 1, max = 1) => {
  const arrayLength = randNumber(min, max);
  return [...Array(arrayLength)].map((_, idx) => generateFunc(idx, arrayLength));
};

/** A small helper to get a value from the data or generate a default one */
const getIdFromData = async (data, keys, defaultGenerator, idKey = 'id') => {
  const existingKey = keys.find(key => typeof get(data, key) !== 'undefined');
  if (existingKey) {
    return get(data, existingKey);
  }

  const newEntity = await defaultGenerator();
  return newEntity.get(idKey);
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
    ...hostData,
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeCollective = async collectiveData => {
  collectiveData = collectiveData || {};
  const type = collectiveData.type || CollectiveType.COLLECTIVE;
  return models.Collective.create({
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
    HostCollectiveId: await getIdFromData(collectiveData, ['HostCollectiveId', 'host.id'], fakeHost),
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeEvent = async collectiveData => {
  let ParentCollectiveId = get(collectiveData, 'ParentCollectiveId') || get(collectiveData, 'parentCollective.id');

  if (!ParentCollectiveId) {
    ParentCollectiveId = (await fakeCollective()).id;
  }

  return fakeCollective({
    name: randStr('Test Event '),
    slug: randStr('event-'),
    ...collectiveData,
    type: 'EVENT',
    ParentCollectiveId: await getIdFromData(
      collectiveData,
      ['ParentCollectiveId', 'parentCollective.id'],
      fakeCollective,
    ),
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeUpdate = async updateData => {
  let FromCollectiveId = get(updateData, 'FromCollectiveId') || get(updateData, 'fromCollective.id');
  let CollectiveId = get(updateData, 'CollectiveId') || get(updateData, 'collective.id');
  let CreatedByUserId = get(updateData, 'CreatedByUserId') || get(updateData, 'createdByUser.id');
  if (!FromCollectiveId) {
    FromCollectiveId = (await fakeCollective()).id;
  }
  if (!CollectiveId) {
    CollectiveId = (await fakeCollective()).id;
  }
  if (!CreatedByUserId) {
    CreatedByUserId = (await fakeUser()).id;
  }

  return models.Update.create({
    slug: randStr('update-'),
    title: randStr('Update '),
    html: '<div><strong>Hello</strong> Test!</div>',
    ...updateData,
    FromCollectiveId,
    CollectiveId,
    CreatedByUserId,
  });
};

export const fakeExpenseAttachment = async attachmentData => {
  return models.ExpenseAttachment.create(
    {
      amount: randAmount(),
      url: `${randUrl()}.pdf`,
      description: randStr(),
      ...attachmentData,
      ExpenseId: await getIdFromData(attachmentData, ['ExpenseId', 'expense.id'], fakeExpense),
      CreatedByUserId: await getIdFromData(attachmentData, ['CreatedByUserId', 'createdByUser.id'], fakeUser),
    },
    {
      include: [models.Expense],
    },
  );
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeExpense = async expenseData => {
  const expense = await models.Expense.create({
    amount: randAmount(),
    currency: 'USD',
    category: 'Engineering',
    description: randStr('Test expense '),
    payoutMethod: 'other',
    incurredAt: new Date(),
    ...expenseData,
    FromCollectiveId: await getIdFromData(expenseData, ['FromCollectiveId', 'fromCollective.id'], fakeCollective),
    CollectiveId: await getIdFromData(expenseData, ['CollectiveId', 'collective.id'], fakeCollective),
    UserId: await getIdFromData(expenseData, ['UserId', 'user.id'], fakeUser),
    lastEditedById: await getIdFromData(expenseData, ['lastEditedById', 'lastEditedBy.id'], fakeUser),
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

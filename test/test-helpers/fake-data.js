// We often use `utils.data` (ie. utils.data('collective1')) in the code to generate test
// data. This approach is enough in certain cases but it has flows:
// - Collectives with unique colomns (slugs) cannot be created without reseting the DB
// - No randomness in produced values
//
// This lib is a superset of `utils.data` that generates values that are random and safe
// to use in loops and repeted tests.

import uuid from 'uuid/v4';
import { get } from 'lodash';
import models from '../../server/models';
import { types as CollectiveType } from '../../server/constants/collectives';
import { randEmail, randUrl } from '../stores';

const randStr = (prefix = '') => `${prefix}${uuid().split('-')[0]}`;
const randAmount = (min = 100, max = 10000000) => Math.floor(Math.random() * max) + min;

/**
 * Creates a fake user. All params are optionals.
 */
export const fakeUser = async () => {
  return models.User.createUserWithCollective({ email: randEmail(), name: randStr('User Name ') });
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
    ParentCollectiveId,
  });
};

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeUpdate = async updateData => {
  let FromCollectiveId = get(updateData, 'FromCollectiveId') || get(updateData, 'fromCollective.id');
  let CollectiveId = get(updateData, 'CollectiveId') || get(updateData, 'collective.id');
  let CreatedByUserId = get(updateData, 'CreatedByUserId') || get(updateData, 'createdByUser.id');
  if (!FromCollectiveId) FromCollectiveId = (await fakeCollective()).id;
  if (!CollectiveId) CollectiveId = (await fakeCollective()).id;
  if (!CreatedByUserId) CreatedByUserId = (await fakeUser()).id;

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

/**
 * Creates a fake update. All params are optionals.
 */
export const fakeExpense = async updateData => {
  let CollectiveId = get(updateData, 'CollectiveId') || get(updateData, 'collective.id');
  let UserId = get(updateData, 'UserId') || get(updateData, 'user.id');
  if (!CollectiveId) CollectiveId = (await fakeCollective()).id;
  if (!UserId) UserId = (await fakeUser()).id;

  return models.Update.create({
    amount: randAmount(),
    attachement: `${randUrl()}/attachment.pdf`,
    currency: 'USD',
    category: 'Engineering',
    description: randStr('Test expense '),
    payoutMethod: 'other',
    ...updateData,
    CollectiveId,
    UserId,
  });
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
  if (!FromCollectiveId) FromCollectiveId = (await fakeCollective()).id;
  if (!CollectiveId) CollectiveId = (await fakeCollective()).id;
  if (!CreatedByUserId) CreatedByUserId = (await fakeUser()).id;
  if (!ExpenseId && !ConversationId) ExpenseId = (await fakeExpense()).id;

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

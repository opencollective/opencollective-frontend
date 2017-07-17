#!/usr/bin/env node
/**
 * This script subscribes the first member of a collective (core contributor)
 * to the `collective.expense.created` notification
 */
import Promise from 'bluebird';
import models from '../server/models';

const debug = require('debug')('subscribe');

const {
  Notification,
  Role
} = models;

const processRows = (rows) => {
    return Promise.map(rows, processRow);
};

const init = () => {

  const query = {
      where: {
        role: 'MEMBER'
      },
      order: [['id', 'ASC']]
  };

  Role.findAll(query)
  .then(processRows)
  .then(() => process.exit(0));
}

const collectives = {};
const type = 'collective.expense.created';

const processRow = (row) => {
  // If we already have a core contributor (member) registered to the notification, we don't add another person
  if (collectives[row.CollectiveId]) {
    console.error(`Collective ${row.CollectiveId} has already userid ${collectives[row.CollectiveId]} subscribed to ${type}`);
    return;
  }
  collectives[row.CollectiveId] = row.UserId;

  debug(`Subscribing UserId ${row.UserId} to ${type} of CollectiveId ${row.CollectiveId}`);
  return Notification.create({
    UserId: row.UserId,
    CollectiveId: row.CollectiveId,
    type
  })
  .then(notification => console.log(`> UserId ${row.UserId} is now subscribed to ${type} of CollectiveId ${row.CollectiveId}`))
  .catch(() => console.error(`UserId ${row.UserId} already subscribed to ${type} of CollectiveId ${row.CollectiveId}`));
};

init();

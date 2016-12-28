#!/usr/bin/env node
/**
 * This script subscribes the first member of a collective (core contributor)
 * to the `group.expense.created` notification
 */
import Promise from 'bluebird';
import models from '../server/models';

const debug = require('debug')('subscribe');

const {
  Notification,
  UserGroup
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

  UserGroup.findAll(query)
  .then(processRows)
  .then(() => process.exit(0));
}

const groups = {};
const type = 'group.expense.created';

const processRow = (row) => {
  // If we already have a core contributor (member) registered to the notification, we don't add another person
  if (groups[row.GroupId]) {
    console.error(`Group ${row.GroupId} has already userid ${groups[row.GroupId]} subscribed to ${type}`);
    return;
  }
  groups[row.GroupId] = row.UserId;

  debug(`Subscribing UserId ${row.UserId} to ${type} of GroupId ${row.GroupId}`);
  return Notification.create({
    UserId: row.UserId,
    GroupId: row.GroupId,
    type
  })
  .then(notification => console.log(`> UserId ${row.UserId} is now subscribed to ${type} of GroupId ${row.GroupId}`))
  .catch(() => console.error(`UserId ${row.UserId} already subscribed to ${type} of GroupId ${row.GroupId}`));
};

init();

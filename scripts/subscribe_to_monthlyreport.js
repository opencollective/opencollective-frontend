#!/usr/bin/env node
/**
 * This script subscribes all members of a collective (core contributors)
 * to the `group.monthlyreport` notification (for all collectives)
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
        role: 'MEMBER',
        createdAt: { $gt: '2016-08-11 00:22:42.277+00' } // only subscribe users who became members of a collective after August 11th 2016
      }
  };

  UserGroup.findAll(query)
  .then(processRows)
  .then(() => process.exit(0));
}

const processRow = (row) => {
  const type = 'group.monthlyreport';
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

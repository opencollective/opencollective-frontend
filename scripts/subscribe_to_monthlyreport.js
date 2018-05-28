#!/usr/bin/env node
/**
 * This script subscribes all members of a collective (core contributors)
 * to the `collective.monthlyreport` notification (for all collectives)
 */
import Promise from 'bluebird';
import models, { Op } from '../server/models';

const debug = require('debug')('subscribe');

const {
  Notification,
  Member
} = models;

const processRows = (rows) => {
    return Promise.map(rows, processRow);
};

const init = () => {

  const query = {
      where: {
        role: 'ADMIN',
        createdAt: { [Op.gt]: '2016-08-11 00:22:42.277+00' } // only subscribe users who became members of a collective after August 11th 2016
      }
  };

  Member.findAll(query)
  .then(processRows)
  .then(() => process.exit(0));
}

const processRow = (row) => {
  const type = 'collective.monthlyreport';
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

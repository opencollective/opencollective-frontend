#!/usr/bin/env node
/**
 * This script subscribes all members of a collective (core contributors)
 * to the `collective.monthlyreport` notification (for all collectives)
 */
import Promise from 'bluebird';
import models from '../server/models';

const debug = require('debug')('subscribe');

const Member = models.Member;
const Notification = models.Notification;

const processRows = (rows) => {
    return Promise.map(rows, processRow);
};

const init = () => {
  Member.findAll()
  .then(processRows)
  .then(() => process.exit(0));
}

const processRow = (row) => {
  const lists = {};
  lists['BACKER'] = 'backers';
  lists['ADMIN'] = 'members';
  const type = `mailinglist.${lists[row.role]}`;
  debug(`Subscribing UserId ${row.UserId} to ${type} of CollectiveId ${row.CollectiveId}`);
  return Notification.create({
    UserId: row.UserId,
    CollectiveId: row.CollectiveId,
    type
  }).catch(() => console.error(`UserId ${row.UserId} already subscribed to ${type} of CollectiveId ${row.CollectiveId}`));
};


init();

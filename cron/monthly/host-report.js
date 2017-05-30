#!/usr/bin/env node

// Only run on the first of the month
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 1) {
  console.log('NODE_ENV is production and today is not the first of month, script aborted!');
  process.exit();
}

process.env.PORT = 3066;

import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import { getTiersStats } from '../../server/lib/utils';
import models from '../../server/models';
import emailLib from '../../server/lib/email';

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth()+1, 1);

console.log("startDate", startDate,"endDate", endDate);

const debug = debugLib('monthlyreport');

const {
  Group,
  UserGroup,
  Notification,
  Transaction,
  User
} = models;

const init = () => {

  const startTime = new Date;

  const query = {
    include: [ { model: models.UserGroup, where: { role: 'HOST' }}]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    query.where = { username: {$in: ['brusselstogether_host', 'adminwwc']} };

  User.findAll(query)
  .tap(hosts => {
      console.log(`Preparing the ${month} report for ${hosts.length} hosts`);
  })
  .then(hosts => Promise.map(hosts, processHost))
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0)
  });
}

const getHostedGroups = (host) => {
  debug(`getHostedGroups(${host.username})`);
  return host.getGroups({ where: { role: 'HOST '}})
}

const getTransactions = (groupids) => {
  debug("groupids", groupids);
  const query = {
    where: {
      GroupId: { $in: groupids },
      createdAt: { $gte: startDate, $lt: endDate }
    }
  }

  return Transaction.find(query);
}

const processHost = (host) => {

  let groups;

  return getHostedGroups(host)
    .then(results => groups = results)
    .then(groups => getTransactions(groups.map(g => g.id)))
    .then(transactions => {
      const data = {
        transactions,
        groups
      };
      debug("data", data);
      return data;
    })
    .then((data) => sendEmail(host.email, data))
    .catch(e => {
      console.error("Error in processing host", host.username, e);
    });
};

const sendEmail = (recipient, data) => {
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('host.monthlyreport', recipient.email, data);
}

init();

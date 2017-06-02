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
import models, {sequelize} from '../../server/models';
import emailLib from '../../server/lib/email';
import { convertToCurrency } from '../../server/lib/currency';

import { getHostedGroups, getBackersStats, getTotalNetAmount, sumTransactions } from '../../server/lib/hostlib';

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth()+1, 1);

console.log("startDate", startDate,"endDate", endDate);

const debug = debugLib('monthlyreport');

const {
  Group,
  User,
  UserGroup,
  Notification,
  Transaction
} = models;

const init = () => {

  const startTime = new Date;

  const query = {
    include: [ { model: models.UserGroup, where: { role: 'HOST' }}]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    query.where = { username: {$in: ['adminwwc']} };

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

const getTransactions = (groupids) => {
  debug("getTransactions for ", groupids.length, "collectives");
  const query = {
    where: {
      GroupId: { $in: groupids },
      createdAt: { $gte: startDate, $lt: endDate }
    }
  };
  return Transaction.findAll(query);
}

const getHostStats = (host, groupids) => {

  const dateRange = {
    createdAt: { $gte: startDate, $lt: endDate }
  };

  const where = {
    GroupId: { $in: groupids }
  };

  return Promise.all([
    sumTransactions('netAmountInGroupCurrency', where, host.currency),                      // total host balance
    sumTransactions('netAmountInGroupCurrency', { ...where, ...dateRange}, host.currency),   // delta host balance last month
    sumTransactions('amount', { type: 'DONATION', ...where, ...dateRange}, host.currency), // total donations last month
    sumTransactions('netAmountInGroupCurrency', { type: 'DONATION', ...where, ...dateRange}, host.currency), // total net amount received last month
    sumTransactions('netAmountInGroupCurrency', { type: 'EXPENSE', ...where, ...dateRange}, host.currency),  // total net amount paid out last month
    sumTransactions("hostFeeInTxnCurrency", dateRange, host.currency),
    sumTransactions("paymentProcessorFeeInTxnCurrency", dateRange, host.currency),
    sumTransactions("platformFeeInTxnCurrency", {...where, ...dateRange}, host.currency),
    getBackersStats(groupids)
  ]);
}

const processHost = (host) => {

  let data = {}, groupsById = {};

  host.currency = host.currency || 'USD'; // TODO: Need to add a currency column to the Users table
  host.name = "WWCode 501c3"; // TODO
  data.host = host;

  return getHostedGroups(host.id)
    .tap(groups => groupsById = _.indexBy(groups, "id"))
    .then(() => getTransactions(Object.keys(groupsById)))
    .tap(transactions => Promise.map(transactions, (t) => {
      const r = t.dataValues;
      r.group = groupsById[r.GroupId];

      // TODO: Need to add a netAmountInHostCurrency column to the Transactions table
      if (r.group.currency !== host.currency) {
        return convertToCurrency(t.netAmountInGroupCurrency, r.group.currency, host.currency, r.createdAt)
          .then(amount => {
            r.amountInHostCurrency = amount;
            return r;
          })
      }
      return r;
    }))
    .then(() => getHostStats(host, Object.keys(groupsById)))
    .then(stats => {
      data.stats = {
        totalCollectives: Object.keys(groupsById).length,
        balance: stats[0],
        delta: stats[1],
        totalNewDonations: stats[2],
        totalNetAmountReceived: stats[3],
        totalNewExpenses: stats[4],
        totalNewHostFees: stats[5],
        paymentProcessorFees: stats[6],
        platformFees: stats[7],
        backers: stats[8]
      }
    })
    .then(() => sendEmail(host.email, data))
    .catch(e => {
      console.error("Error in processing host", host.username, e);
    });
};

const sendEmail = (recipient, data) => {
    debug("Sending email to ", recipient);
    debug("email data transactions", data.transactions);
    debug("email data stats", data.stats);
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('host.monthlyreport', recipient.email, data);
}

init();

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
import Promise from 'bluebird';
import debugLib from 'debug';
import models, { sequelize } from '../../server/models';
import emailLib from '../../server/lib/email';
import config from 'config';
import { exportTransactions } from '../../server/lib/transactions';
import { getHostedGroups, getBackersStats, sumTransactions, getTransactions } from '../../server/lib/hostlib';

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');

const csv_filename = `${moment(d).format('YYYYMM')}-transactions.csv`;

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth()+1, 1);

console.log("startDate", startDate,"endDate", endDate);

const debug = debugLib('monthlyreport');

const {
  User,
  Transaction
} = models;

const init = () => {

  const startTime = new Date;

  let previewCondition = '';
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    previewCondition = "AND u.username IN ('adminwwc', 'host-org')";

  const query = `SELECT u.id, u.currency, u.username, u."firstName", u."lastName" FROM "Users" u LEFT JOIN "UserGroups" ug ON ug."UserId" = u.id WHERE ug.role='HOST' AND ug."deletedAt" IS NULL and u."deletedAt" IS NULL ${previewCondition} GROUP BY u.id`;

  sequelize.query(query, {
    model: models.User,
    type: sequelize.QueryTypes.SELECT
  })
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
    sumTransactions("hostFeeInTxnCurrency", {...where, ...dateRange}, host.currency),
    sumTransactions("paymentProcessorFeeInTxnCurrency", {...where, ...dateRange}, host.currency),
    sumTransactions("platformFeeInTxnCurrency", {...where, ...dateRange}, host.currency),
    getBackersStats(groupids, startDate, endDate)
  ]);
}

const processHost = (host) => {

  const data = {};
  let groupsById = {}, attachment;

  data.host = host;
  data.reportDate = endDate;
  data.month = month;
  data.config = _.pick(config, 'host');

  return getHostedGroups(host.id)
    .tap(groups => groupsById = _.indexBy(groups, "id"))
    .then(() => getTransactions(Object.keys(groupsById), startDate, endDate))
    .tap(transactions => {
      data.transactions = transactions;
      return exportTransactions(transactions)
       .then(csv => {
          attachment = {
            filename: csv_filename,
            content: csv
          }
        })
    })
    .then(transactions => transactions.map(t => {
      const r = t.info;
      r.group = groupsById[r.GroupId].dataValues;
      return r;
    }))
    .then(() => getHostStats(host, Object.keys(groupsById)))
    .then(stats => {
      data.stats = {
        totalCollectives: Object.keys(groupsById).length,
        balance: stats[0],
        delta: stats[1],
        totalNewDonations: stats[2],
        totalNetAmountReceivedForCollectives: stats[3],
        totalNewExpenses: stats[4],
        totalNewHostFees: stats[5],
        paymentProcessorFees: stats[6],
        platformFees: stats[7],
        backers: stats[8]
      };
      data.stats.totalNetAmountReceived = {
        totalInHostCurrency: data.stats.totalNetAmountReceivedForCollectives.totalInHostCurrency + data.stats.totalNewHostFees.totalInHostCurrency
      };
    })
    .then(() => sendEmail(host, data, attachment))
    .catch(e => {
      console.error("Error in processing host", host.username, e);
    });
};

const sendEmail = (recipient, data, attachment) => {
    debug("Sending email to ", recipient.dataValues);
    // debug("email data transactions", data.transactions);
    debug("email data stats", data.stats);
    debug("email data stats.backers", data.stats.backers);
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    if (process.env.SEND_EMAIL_TO) {
      recipient.email = process.env.SEND_EMAIL_TO;
    }
    const options = {
      attachments: [ attachment ]
    }
    return emailLib.send('host.monthlyreport', recipient.email, data, options);
}

init();

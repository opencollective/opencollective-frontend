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
import { exportToCSV, exportToPDF } from '../../server/lib/utils';
import { getTransactions } from '../../server/lib/transactions';
import { getHostedGroups, getBackersStats, sumTransactions } from '../../server/lib/hostlib';
import path from 'path';
import fs from 'fs';

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');
const year = d.getFullYear();

const csv_filename = `${moment(d).format('YYYYMM')}-transactions.csv`;
const pdf_filename = `${moment(d).format('YYYYMM')}-expenses.pdf`;

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth()+1, 1);

console.log("startDate", startDate,"endDate", endDate);

const debug = debugLib('monthlyreport');

const summary = {
  totalHosts: 0,
  totalActiveHosts: 0,
  totalCollectives: 0,
  totalActiveCollectives: 0,
  totalTransactions: 0,
  hosts: []
};

const init = () => {

  const startTime = new Date;

  let previewCondition = '';
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    previewCondition = "AND u.username IN ('ignitetalks', 'host-org', 'adminwwc')";

  const query = `SELECT u.id, u.currency, u.username, u."firstName", u."lastName" FROM "Users" u LEFT JOIN "UserGroups" ug ON ug."UserId" = u.id WHERE ug.role='HOST' AND ug."deletedAt" IS NULL and u."deletedAt" IS NULL ${previewCondition} GROUP BY u.id`;

  sequelize.query(query, {
    model: models.User,
    type: sequelize.QueryTypes.SELECT
  })
  .tap(hosts => {
      console.log(`Preparing the ${month} report for ${hosts.length} hosts`);
  })
  .then(hosts => Promise.map(hosts, processHost))
  .then(() => getPlatformStats())
  .then(platformStats => {
    const timeLapsed = Math.round((new Date - startTime)/1000); // in seconds
    console.log(`Total run time: ${timeLapsed}s`);
    summary.timeLapsed = timeLapsed;
    summary.month = month;
    summary.platformStats = {
      totalHostBalance: platformStats[0],
      deltaHostBalance: platformStats[1],
      totalDonations: platformStats[2],
      totalNetAmountReceived: platformStats[3],
      totalAmountPaidExpenses: platformStats[4],
      totalHostFees: platformStats[5],
      totalPaymentProcessorFees: platformStats[6],
      totalPlatformFees: platformStats[7],
      backers: platformStats[8]
    };
    summary.hosts.sort((a, b) => {
      return b.stats.backers.new - a.stats.backers.new;
    });
    return emailLib.send('host.monthlyreport.summary', 'info@opencollective.com', summary);
  })
  .then(() => {
    process.exit(0);
  });
}


const getPlatformStats = () => {

  const dateRange = {
    createdAt: { $gte: startDate, $lt: endDate }
  };

  return Promise.all([
    sumTransactions('netAmountInGroupCurrency', {}, 'USD'),                      // total host balance
    sumTransactions('netAmountInGroupCurrency', { ...dateRange}, 'USD'),   // delta host balance last month
    sumTransactions('amount', { type: 'DONATION', ...dateRange}, 'USD'), // total donations last month
    sumTransactions('netAmountInGroupCurrency', { type: 'DONATION', ...dateRange}, 'USD'), // total net amount received last month (after processing fee and host fees)
    sumTransactions('netAmountInGroupCurrency', { type: 'EXPENSE', ...dateRange}, 'USD'),  // total net amount paid out last month
    sumTransactions("hostFeeInTxnCurrency", dateRange, 'USD'),
    sumTransactions("paymentProcessorFeeInTxnCurrency", dateRange, 'USD'),
    sumTransactions("platformFeeInTxnCurrency", dateRange, 'USD'),
    getBackersStats(startDate, endDate)
  ]);
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
    getBackersStats(startDate, endDate, groupids)
  ]);
}

const processHost = (host) => {

  summary.totalHosts++;

  const data = {}, attachments = [];
  let groupsById = {};

  data.host = host;
  data.reportDate = endDate;
  data.month = month;
  data.year = year;
  data.config = _.pick(config, 'host');
  data.maxSlugSize = 0;
  data.notes = null;
  const note = `using fxrate of the day of the transaction as provided by the ECB. Your effective fxrate may vary.`;
  let page = 1;
  let currentPage = 0;
  const expensesPerPage = 30; // number of expenses per page of the Table Of Content (for PDF export)
  data.expensesPerPage = [ [] ];
  data.totalPaidExpenses = 0;
  const processTransaction = (transaction) => {
    const t = transaction;
    t.group = groupsById[t.GroupId].dataValues;
    t.group.shortSlug = t.group.slug.replace(/^wwcode-?(.)/, '$1');
    t.notes = t.Expense && t.Expense.notes;
    if (t.data && t.data.fxrateSource) {
      t.notes = (t.notes) ? `${t.notes} (${note})` : note;
      data.notes = t.note;
    }

    // We prepare expenses for the PDF export
    if (t.type === 'EXPENSE') {
      t.page = page++;
      data.totalPaidExpenses++;
      if (page - 1 % expensesPerPage === 0) {
        currentPage++;
        data.expensesPerPage[currentPage] = [];
      }
      data.expensesPerPage[currentPage].push(t);
    }

    data.maxSlugSize = Math.max(data.maxSlugSize, t.group.shortSlug.length + 1);
    if (!t.description) {
      return transaction.getSource().then(source => {
          t.description = source.title
          return t;
        });
    } else {
      return Promise.resolve(t);      
    }
  }

  return getHostedGroups(host.id)
    .tap(groups => groupsById = _.indexBy(groups, "id"))
    .then(() => getTransactions(Object.keys(groupsById), startDate, endDate, { include: ['Expense', 'User'] }))
    .tap(transactions => {
      if (!transactions || transactions.length == 0) {
        throw new Error(`No transaction found`);
      }
    })
    .then(transactions => Promise.map(transactions, processTransaction))
    .tap(transactions => {

      const getColumnName = (attr) => {
        if (attr === 'GroupId') return "collective";
        else return attr;
      }

      const processValue = (attr, value) => {
        if (attr === "GroupId") return groupsById[value].slug;
        else return value;
      }

      const csv = exportToCSV(transactions, ['id', 'createdAt', 'GroupId', 'amount', 'currency', 'description', 'netAmountInGroupCurrency', 'txnCurrency', 'txnCurrencyFxRate', 'paymentProcessorFeeInTxnCurrency', 'hostFeeInTxnCurrency', 'platformFeeInTxnCurrency', 'netAmountInTxnCurrency', 'note' ], getColumnName, processValue);
  
      attachments.push({
        filename: csv_filename,
        content: csv
      });

    })
    .then(transactions => data.transactions = transactions)
    .then(() => exportToPDF("expenses", data, {
      paper: host.currency === 'USD' ? 'Letter' : 'A4'
    }))
    .then(pdf => {
      attachments.push({
        filename: pdf_filename,
        content: pdf
      })
    })
    .then(() => getHostStats(host, Object.keys(groupsById)))
    .then(stats => {
      data.stats = {
        totalCollectives: Object.keys(groupsById).length,
        totalActiveCollectives: Object.keys(_.indexBy(data.transactions, "GroupId")).length,
        totalTransactions: data.transactions.length,
        balance: stats[0],
        delta: stats[1],
        totalDonations: stats[2],
        totalNetAmountReceivedForCollectives: stats[3],
        totalAmountPaidExpenses: stats[4],
        totalHostFees: stats[5],
        paymentProcessorFees: stats[6],
        platformFees: stats[7],
        backers: stats[8]
      };
      data.stats.totalNetAmountReceived = {
        totalInHostCurrency: data.stats.totalNetAmountReceivedForCollectives.totalInHostCurrency + data.stats.totalHostFees.totalInHostCurrency
      };
      summary.hosts.push({
        host: { name: host.name, username: host.username, currency: host.currency },
        stats: data.stats
      });
      summary.totalActiveHosts++;
      summary.totalCollectives += data.stats.totalCollectives;
      summary.totalActiveCollectives += data.stats.totalActiveCollectives;
      summary.totalTransactions += data.stats.totalTransactions;
    })
    .then(() => sendEmail(host, data, attachments))
    .catch(e => {
      console.error(`Error in processing host ${host.username}:`, e.message);
      debug(e);
    });
};

const sendEmail = (recipient, data, attachments) => {
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
      attachments
    }
    if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
      attachments.map(attachment => {
        const filepath = path.resolve(`/tmp/${recipient.username}-${attachment.filename}`);
        fs.writeFileSync(filepath, attachment.content);
        console.log(">>> preview attachment", filepath);
      })
    }

    return emailLib.send('host.monthlyreport', recipient.email, data, options);
}

init();

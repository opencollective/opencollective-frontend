import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import debugLib from 'debug';
import models, { sequelize, Op } from '../server/models';
import emailLib from '../server/lib/email';
import config from 'config';
import { exportToCSV, exportToPDF } from '../server/lib/utils';
import { getTransactions } from '../server/lib/transactions';
import { getHostedCollectives, getBackersStats, sumTransactions } from '../server/lib/hostlib';
import path from 'path';
import fs from 'fs';

const debug = debugLib('hostreport');

if (process.env.SKIP_PLATFORM_STATS) {
  console.log("Skipping computing platform stats");
}

const summary = {
  totalHosts: 0,
  totalActiveHosts: 0,
  totalCollectives: 0,
  totalActiveCollectives: 0,
  numberTransactions: 0,
  numberDonations: 0,
  numberPaidExpenses: 0,
  hosts: []
};

const deltaAmount = (a, b) => {
  const r = {};
  for (const attr in a) {
    r[attr] = a[attr] - b[attr];
  }
  return r;
}

async function HostReport(year, month, hostId) {

  const startTime = new Date;
  let previousStartDate, startDate, endDate;

  const d = new Date;

  if (!month) {
    // yearly report
    d.setFullYear(year);
    previousStartDate = new Date(d.getFullYear()-1, 0, 1);
    startDate = new Date(d.getFullYear(), 0, 1);
    endDate = new Date(d.getFullYear() + 1, 0, 1);
  } else {
    d.setMonth(d.getMonth() - 2);
    previousStartDate = new Date(d.getFullYear(), d.getMonth(), 1);
    startDate = new Date(d.getFullYear(), d.getMonth()+1, 1);
    endDate = new Date(d.getFullYear(), d.getMonth()+2, 1);
  }

  const dateRange = {
    createdAt: { [Op.gte]: startDate, [Op.lt]: endDate }
  };

  const previousDateRange = {
    createdAt: { [Op.gte]: previousStartDate, [Op.lt]: startDate }
  }

  const emailTemplate = (!month) ? 'host.yearlyreport' : 'host.monthlyreport';
  const reportName = (!month) ? `${year} Yearly Host Report` : `${year}/${month+1} Monthly Host Report`;
  const dateFormat = (!month) ? 'YYYY' : 'YYYYMM';
  const csv_filename = `${moment(d).format(dateFormat)}-transactions.csv`;
  const pdf_filename = `${moment(d).format(dateFormat)}-expenses.pdf`;
  console.log("startDate", startDate,"endDate", endDate);

  year = year || startDate.getFullYear();

  let previewCondition = '';
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    previewCondition = "AND c.id IN (11004, 9804, 9802, 9801)"; // open source collective host, wwcode host, brusselstogether, changex
    // previewCondition = "AND c.id IN (9802)"; // brusselstogether

  if (hostId) {
    previewCondition = `AND c.id = ${hostId}`
  }

  if (process.env.SLUGS) {
    const slugs = process.env.SLUGS.split(',');
    previewCondition = `AND c.slug IN ('${slugs.join("','")}')`
  }

  const getPlatformStats = () => {

    return models.Collective.findAll({ where: { type: { [Op.in]: ['COLLECTIVE', 'EVENT'] } } })
      .then((collectives) => {
        const where = {
          CollectiveId: { [Op.in]: collectives.map(c => c.id) }
        };
        const now = new Date;
        const catchError = (e) => {
          console.error(">>> host-report.js: unable to perform the sum of transactions", e);
          return 0;
        }
        return Promise.all([
          sumTransactions('netAmountInCollectiveCurrency', where, 'USD', now).catch(catchError),                      // total host balance
          sumTransactions('netAmountInCollectiveCurrency', { ...where, ...dateRange}, 'USD', now).catch(catchError),   // delta host balance last month
          sumTransactions('amount', { ...where, type: 'CREDIT', ...dateRange, platformFeeInHostCurrency: { [Op.gt]: 0 }}, 'USD', now).catch(catchError), // total donations last month excluding  "add funds"
          sumTransactions('amount', { ...where, type: 'CREDIT', ...previousDateRange, platformFeeInHostCurrency: { [Op.gt]: 0 }}, 'USD', now).catch(catchError), // total donations last month excluding  "add funds" previous month
          sumTransactions('amount', { ...where, type: 'CREDIT', ...dateRange, platformFeeInHostCurrency: { [Op.or]: [null, 0 ] } }, 'USD', now).catch(catchError), // total "add funds" last month
          sumTransactions('amount', { ...where, type: 'CREDIT', ...previousDateRange, platformFeeInHostCurrency: { [Op.or]: [null, 0 ] } }, 'USD', now).catch(catchError), // total "add funds" previous month
          sumTransactions('netAmountInCollectiveCurrency', { ...where, type: 'CREDIT', ...dateRange}, 'USD', now).catch(catchError), // total net amount received last month (after processing fee and host fees)
          sumTransactions('netAmountInCollectiveCurrency', { ...where, type: 'DEBIT', ...dateRange}, 'USD', now).catch(catchError),  // total net amount paid out last month
          sumTransactions('netAmountInCollectiveCurrency', { ...where, type: 'DEBIT', ...previousDateRange}, 'USD', now).catch(catchError),  // total net amount paid out previous month
          sumTransactions("hostFeeInHostCurrency", { ...where, ...dateRange }, 'USD', now).catch(catchError),
          sumTransactions("hostFeeInHostCurrency", { ...where, ...previousDateRange }, 'USD', now).catch(catchError),
          sumTransactions("paymentProcessorFeeInHostCurrency", { ...where, ...dateRange }, 'USD', now).catch(catchError),
          sumTransactions("paymentProcessorFeeInHostCurrency", { ...where, ...previousDateRange }, 'USD', now).catch(catchError),
          sumTransactions("platformFeeInHostCurrency", { ...where, ...dateRange }, 'USD', now).catch(catchError),
          sumTransactions("platformFeeInHostCurrency", { ...where, ...previousDateRange }, 'USD', now).catch(catchError),
          getBackersStats(startDate, endDate)
        ])
      });
  }

  const getHostStats = (host, collectiveids) => {

    const where = {
      CollectiveId: { [Op.in]: collectiveids }
    };

    return Promise.all([
      sumTransactions('netAmountInCollectiveCurrency', where, host.currency),                      // total host balance
      sumTransactions('netAmountInCollectiveCurrency', { ...where, ...dateRange}, host.currency),   // delta host balance last month
      sumTransactions('amount', { type: 'CREDIT', ...where, ...dateRange}, host.currency), // total donations last month
      sumTransactions('netAmountInCollectiveCurrency', { type: 'CREDIT', ...where, ...dateRange}, host.currency), // total net amount received last month
      sumTransactions('netAmountInCollectiveCurrency', { type: 'DEBIT', ...where, ...dateRange}, host.currency),  // total net amount paid out last month
      sumTransactions("hostFeeInHostCurrency", {...where, ...dateRange}, host.currency),
      sumTransactions("paymentProcessorFeeInHostCurrency", {...where, ...dateRange}, host.currency),
      sumTransactions("platformFeeInHostCurrency", {...where, ...dateRange}, host.currency),
      getBackersStats(startDate, endDate, collectiveids)
    ]);
  }

  const processHost = (host) => {

    summary.totalHosts++;
    console.log(">>> Processing host", host.slug);
    const data = {}, attachments = [];
    const note = `using fxrate of the day of the transaction as provided by the ECB. Your effective fxrate may vary.`;
    const expensesPerPage = 30; // number of expenses per page of the Table Of Content (for PDF export)

    let collectivesById = {};
    let page = 1;
    let currentPage = 0;

    data.host = host;
    data.collective = host;
    data.reportDate = endDate;
    data.month = month && moment(startDate).format('MMMM');
    data.year = year;
    data.config = _.pick(config, 'host');
    data.maxSlugSize = 0;
    data.notes = null;
    data.expensesPerPage = [ [] ];
    data.stats = {
      numberPaidExpenses: 0
    };

    const getHostAdminsEmails = (host) => {
      if (host.type === 'USER') {
        return models.User.findAll({ where: { CollectiveId: host.id }}).map(u => u.email);
      }
      return models.Member.findAll({
        where: {
          CollectiveId: host.id,
          role: 'ADMIN',
        }
      }).map(admin => {
        return models.User.findOne({
          attributes: ['email'],
          where: { CollectiveId: admin.MemberCollectiveId }
        }).then(user => user.email)
      }, { concurrency: 1 })
    };

    const processTransaction = (transaction) => {
      const t = transaction;
      t.collective = collectivesById[t.CollectiveId].dataValues;
      t.collective.shortSlug = t.collective.slug.replace(/^wwcode-?(.)/, '$1');
      t.notes = t.Expense && t.Expense.privateMessage;
      if (t.data && t.data.fxrateSource) {
        t.notes = (t.notes) ? `${t.notes} (${note})` : note;
        data.notes = note;
      }

      // We prepare expenses for the PDF export
      if (t.type === 'DEBIT' && t.ExpenseId) {
        t.page = page++;
        data.stats.numberPaidExpenses++;
        if ((page - 1) % expensesPerPage === 0) {
          currentPage++;
          data.expensesPerPage[currentPage] = [];
        }
        data.expensesPerPage[currentPage].push(t);
      }

      data.maxSlugSize = Math.max(data.maxSlugSize, t.collective.shortSlug.length + 1);
      if (!t.description) {
        return transaction.getSource().then(source => {
          if (!source) {
            console.log(">>> no source found for ", transaction);
            return t;
          }
            t.description = source.description
            return t;
          });
      } else {
        return Promise.resolve(t);
      }
    }

    return getHostedCollectives(host.id, endDate)
      .tap(collectives => {
        collectivesById = _.indexBy(collectives, "id")
        data.stats.totalCollectives = Object.keys(collectivesById).length;
        summary.totalCollectives += data.stats.totalCollectives;
        console.log(`>>> processing ${data.stats.totalCollectives} collectives`);
      })
      .then(() => getTransactions(Object.keys(collectivesById), startDate, endDate, {
        include: [
          { model: models.Expense },
          { model: models.User, as: 'createdByUser' }
        ]
      }))
      .tap(transactions => {
        if (!transactions || transactions.length == 0) {
          throw new Error(`No transaction found`);
        }
        console.log(`>>> processing ${transactions.length} transactions`);
      })
      .map(processTransaction)
      .tap(transactions => {

        const getColumnName = (attr) => {
          if (attr === 'CollectiveId') return "collective";
          if (attr === 'Expense.privateMessage') return "private note";
          else return attr;
        }

        const processValue = (attr, value) => {
          if (attr === "CollectiveId") return collectivesById[value].slug;
          if (['amount', 'netAmountInCollectiveCurrency', 'paymentProcessorFeeInHostCurrency', 'hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'netAmountInHostCurrency'].indexOf(attr) !== -1) {
            return value / 100; // converts cents
          }
          return value;
        }

        const csv = exportToCSV(transactions,
          [
            'id', 'createdAt', 'CollectiveId', 'amount', 'currency', 'description', 'netAmountInCollectiveCurrency', 'hostCurrency', 'hostCurrencyFxRate',
            'paymentProcessorFeeInHostCurrency', 'hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'netAmountInHostCurrency', 'Expense.privateMessage'
          ],
          getColumnName,
          processValue);

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
      .then(() => getHostStats(host, Object.keys(collectivesById)))
      .then(stats => {
        data.stats = {
          ... data.stats,
          totalActiveCollectives: Object.keys(_.indexBy(data.transactions, "CollectiveId")).length,
          numberTransactions: data.transactions.length,
          balance: stats[0],
          delta: stats[1],
          numberDonations: data.transactions.length - data.stats.numberPaidExpenses,
          totalAmountDonations: stats[2],
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
          host: { name: host.name, slug: host.slug, currency: host.currency },
          stats: data.stats
        });
        summary.totalActiveHosts++;
        summary.totalActiveCollectives += data.stats.totalActiveCollectives;
        summary.numberTransactions += data.stats.numberTransactions;
        summary.numberDonations += data.stats.numberDonations;
        summary.numberPaidExpenses += data.stats.numberPaidExpenses;
        summary.totalAmountPaidExpenses += data.stats.totalAmountPaidExpenses;
      })
      .then(() => getHostAdminsEmails(host))
      .then((admins) => sendEmail(admins, data, attachments))
      .catch(e => {
        console.error(`Error in processing host ${host.slug}:`, e.message, e);
        debug(e);
      });
  };

  const sendEmail = (recipients, data, attachments) => {
      debug("Sending email to ", recipients);
      if (!recipients || recipients.length === 0){
        console.error("Unable to send host report for ", data.host.slug, "No recipient to send to");
        return;
      }
      // debug("email data transactions", data.transactions);
      debug("email data stats", data.stats);
      debug("email data stats.backers", data.stats.backers);
      const options = {
        attachments
      }
      if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
        attachments.map(attachment => {
          const filepath = path.resolve(`/tmp/${data.host.slug}-${attachment.filename}`);
          fs.writeFileSync(filepath, attachment.content);
          console.log(">>> preview attachment", filepath);
        })
        recipients.push("ops+test@opencollective.com");
      }
      return emailLib.send(emailTemplate, recipients, data, options);
  }

  const query = `
  with "hosts" as (SELECT DISTINCT "HostCollectiveId" AS id FROM "Collectives" WHERE "deletedAt" IS NULL AND "isActive" IS TRUE AND "HostCollectiveId" IS NOT NULL)
  SELECT c.* FROM "Collectives" c WHERE c.id IN (SELECT h.id FROM hosts h) ${previewCondition}
  `;

  const hosts = await sequelize.query(query, {
    model: models.Collective,
    type: sequelize.QueryTypes.SELECT
  });
  console.log(`Preparing the ${reportName} for ${hosts.length} hosts`);

  return Promise.map(hosts, processHost, { concurrency: 1 })
  .then(() => !process.env.SKIP_PLATFORM_STATS && getPlatformStats())
  .then(platformStats => {
    const timeLapsed = Math.round((new Date - startTime)/1000); // in seconds
    console.log(`Total run time: ${timeLapsed}s`);    
    if (!platformStats) return;

    summary.timeLapsed = timeLapsed;
    summary.month = month && moment(startDate).format('MMMM');
    summary.year = year;
    summary.platformStats = {
      totalHostBalance: platformStats[0],
      deltaHostBalance: platformStats[1],
      totalPlatformDonations: platformStats[2],
      deltaPlatformDonations: deltaAmount(platformStats[2], platformStats[3]),
      totalAddFunds: platformStats[4],
      deltaAddFunds: deltaAmount(platformStats[4], platformStats[5]),
      totalNetAmountReceived: platformStats[6],
      totalAmountPaidExpenses: platformStats[7],
      deltaAmountPaidExpenses: deltaAmount(platformStats[7], platformStats[8]),
      totalHostFees: platformStats[9],
      deltaHostFees: deltaAmount(platformStats[9], platformStats[10]),
      totalPaymentProcessorFees: platformStats[11],
      deltaPaymentProcessorFees: deltaAmount(platformStats[11], platformStats[12]),
      totalPlatformFees: platformStats[13],
      deltaPlatformFees: deltaAmount(platformStats[13], platformStats[14]),
      backers: platformStats[15]
    };
    summary.hosts.sort((a, b) => {
      return b.stats.backers.new - a.stats.backers.new;
    });
    summary.numberDonations = summary.numberTransactions - summary.numberPaidExpenses;
    return emailLib.send('host.report.summary', 'info@opencollective.com', summary);
  })
  .then(() => {
    console.log(">>> All done. Exiting.");
    process.exit(0);
  })

}

export default HostReport;

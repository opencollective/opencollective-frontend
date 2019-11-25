import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import debugLib from 'debug';
import models, { sequelize, Op } from '../server/models';
import emailLib from '../server/lib/email';
import config from 'config';
import { exportToPDF } from '../server/lib/utils';
import { getTransactions } from '../server/lib/transactions';
import { getHostedCollectives, getBackersStats, sumTransactions } from '../server/lib/hostlib';

const debug = debugLib('hostreport');

if (process.env.SKIP_PLATFORM_STATS) {
  console.log('Skipping computing platform stats');
}

const summary = {
  totalHosts: 0,
  totalActiveHosts: 0,
  totalCollectives: 0,
  totalActiveCollectives: 0,
  numberTransactions: 0,
  numberDonations: 0,
  numberPaidExpenses: 0,
  hosts: [],
};

async function HostReport(year, month, hostId) {
  let startDate, endDate;

  const d = new Date();
  d.setFullYear(year);
  let yearlyReport = false;
  if (typeof month === 'number') {
    d.setMonth(month);
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  } else {
    // yearly report
    month = '';
    yearlyReport = true;
    startDate = new Date(d.getFullYear(), 0, 1);
    endDate = new Date(d.getFullYear() + 1, 0, 1);
  }

  const endDateIncluded = moment(endDate)
    .subtract(1, 'days')
    .toDate();

  const dateRange = {
    createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
  };

  const emailTemplate = yearlyReport ? 'host.yearlyreport' : 'host.monthlyreport';
  const reportName = yearlyReport ? `${year} Yearly Host Report` : `${year}/${month + 1} Monthly Host Report`;
  const dateFormat = yearlyReport ? 'YYYY' : 'YYYYMM';
  const csv_filename = `${moment(d).format(dateFormat)}-transactions.csv`;
  const pdf_filename = `${moment(d).format(dateFormat)}-expenses.pdf`;
  console.log('startDate', startDate, 'endDate', endDate);

  year = year || startDate.getFullYear();

  let previewCondition = '';
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    previewCondition = 'AND c.id IN (11004, 9804, 9802, 9801)'; // open source collective host, wwcode host, brusselstogether, changex
  // previewCondition = "AND c.id IN (9802)"; // brusselstogether

  if (hostId) {
    previewCondition = `AND c.id = ${hostId}`;
  }

  if (process.env.SLUGS) {
    const slugs = process.env.SLUGS.split(',');
    previewCondition = `AND c.slug IN ('${slugs.join("','")}')`;
    process.env.SKIP_PLATFORM_STATS = true;
  }

  const getHostStats = (host, collectiveids) => {
    // Since collectives can change host,
    // we don't fetch transactions based on the CollectiveId but based on the HostCollectiveId
    // at the time of the transaction
    const where = { HostCollectiveId: host.id };
    const whereWithDateRange = { ...where, ...dateRange };

    const payoutProcessorFeesQuery = service => {
      // When using Sequelize query.include[].where it performs the condition on the join and it doesn't work
      // that's why have to do the query this this way.
      if (service === 'paypal') {
        where['$PaymentMethod.service$'] = 'paypal';
      } else {
        where['$PaymentMethod.service$'] = {
          [Op.or]: { [Op.ne]: 'paypal', [Op.is]: null },
        };
      }

      return {
        where: { ...where, ...dateRange, type: 'DEBIT' },
        raw: true,
        include: [
          {
            model: models.PaymentMethod,
            attributes: [[sequelize.fn('MAX', sequelize.col('service')), 'service']],
          },
        ],
      };
    };

    return Promise.props({
      balance: sumTransactions(
        'netAmountInCollectiveCurrency',
        { where: { ...where, createdAt: { [Op.lt]: endDate } } },
        host.currency,
      ), // total host balance
      delta: sumTransactions('netAmountInCollectiveCurrency', { where: whereWithDateRange }, host.currency), // delta host balance last month
      totalAmountDonations: sumTransactions(
        'amount',
        { where: { ...whereWithDateRange, type: 'CREDIT' } },
        host.currency,
      ), // total donations last month
      totalNetAmountReceivedForCollectives: sumTransactions(
        'netAmountInCollectiveCurrency',
        { where: { ...whereWithDateRange, type: 'CREDIT' } },
        host.currency,
      ), // total net amount received last month
      totalAmountPaidExpenses: sumTransactions(
        'netAmountInCollectiveCurrency',
        { where: { ...whereWithDateRange, type: 'DEBIT' } },
        host.currency,
      ), // total net amount paid out last month
      totalTaxAmountCollected: sumTransactions(
        'taxAmount',
        { where: whereWithDateRange, type: 'CREDIT' },
        host.currency,
      ), // total tax collected
      totalTaxAmountPaid: sumTransactions('taxAmount', { where: whereWithDateRange, type: 'DEBIT' }, host.currency), // total tax paid
      // We only count HostFees on CREDIT transactions with an Order and on DEBIT transactions with an Expense
      // (because the host fee of the destination host is recorded in the DEBIT transaction when making a donation to another host)
      totalHostFees: sumTransactions(
        'hostFeeInHostCurrency',
        {
          where: {
            ...whereWithDateRange,
            [Op.or]: [
              { type: 'CREDIT', OrderId: { [Op.ne]: null } },
              { type: 'DEBIT', ExpenseId: { [Op.ne]: null } },
            ],
          },
        },
        host.currency,
      ),
      backers: getBackersStats(startDate, endDate, collectiveids),
      platformFees: sumTransactions(
        'platformFeeInHostCurrency',
        { where: { ...whereWithDateRange, type: 'CREDIT' } },
        host.currency,
      ),
      paymentProcessorFees: sumTransactions(
        'paymentProcessorFeeInHostCurrency',
        { where: { ...whereWithDateRange, type: 'CREDIT' } },
        host.currency,
      ), // total stripe fees
      payoutProcessorFeesPaypal: sumTransactions(
        'paymentProcessorFeeInHostCurrency',
        payoutProcessorFeesQuery('paypal'),
        host.currency,
      ), // total paypal fees
      payoutProcessorFeesOther: sumTransactions(
        'paymentProcessorFeeInHostCurrency',
        payoutProcessorFeesQuery('other'),
        host.currency,
      ), // total other payout processor fees (manually recorded)
    });
  };

  const processHost = host => {
    summary.totalHosts++;
    console.log('>>> Processing host', host.slug);
    const data = {},
      attachments = [];
    const note = 'using fxrate of the day of the transaction as provided by the ECB. Your effective fxrate may vary.';
    const expensesPerPage = 30; // number of expenses per page of the Table Of Content (for PDF export)

    let collectivesById = {};
    let page = 1;
    let currentPage = 0;

    data.host = host;
    data.collective = host;
    data.reportDate = endDate;
    data.reportName = reportName;
    data.month = !yearlyReport && moment(startDate).format('MMMM');
    data.year = year;
    data.startDate = startDate;
    data.endDate = endDate;
    data.endDateIncluded = endDateIncluded;
    data.config = _.pick(config, 'host');
    data.maxSlugSize = 0;
    data.notes = null;
    data.expensesPerPage = [[]];
    data.stats = {
      numberPaidExpenses: 0,
    };

    const getHostAdminsEmails = host => {
      if (host.type === 'USER') {
        return models.User.findAll({ where: { CollectiveId: host.id } }).map(u => u.email);
      }
      return models.Member.findAll({
        where: {
          CollectiveId: host.id,
          role: 'ADMIN',
        },
      }).map(
        admin => {
          return models.User.findOne({
            attributes: ['email'],
            where: { CollectiveId: admin.MemberCollectiveId },
          }).then(user => user.email);
        },
        { concurrency: 1 },
      );
    };

    const processTransaction = transaction => {
      const t = transaction;
      t.collective = collectivesById[t.CollectiveId].dataValues;
      t.collective.shortSlug = t.collective.slug.replace(/^wwcode-?(.)/, '$1');
      t.notes = t.Expense && t.Expense.privateMessage;
      if (t.data && t.data.fxrateSource) {
        t.notes = t.notes ? `${t.notes} (${note})` : note;
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
            console.log('>>> no source found for ', transaction);
            return t;
          }
          t.description = source.description;
          return t;
        });
      } else {
        return Promise.resolve(t);
      }
    };

    return getHostedCollectives(host.id, endDate)
      .tap(collectives => {
        collectivesById = _.keyBy(collectives, 'id');
        data.stats.totalCollectives = collectives.filter(c => c.type === 'COLLECTIVE').length;
        summary.totalCollectives += data.stats.totalCollectives;
        console.log(`>>> processing ${data.stats.totalCollectives} collectives`);
      })
      .then(() =>
        getTransactions(Object.keys(collectivesById), startDate, endDate, {
          include: [{ model: models.Expense }, { model: models.User, as: 'createdByUser' }],
        }),
      )
      .tap(transactions => {
        if (!transactions || transactions.length == 0) {
          throw new Error('No transaction found');
        }
        console.log(`>>> processing ${transactions.length} transactions`);
      })
      .map(processTransaction)
      .tap(transactions => {
        const csv = models.Transaction.exportCSV(transactions, collectivesById);
        attachments.push({
          filename: csv_filename,
          content: csv,
        });
      })
      .then(transactions => (data.transactions = transactions))
      .then(() =>
        exportToPDF('expenses', data, {
          paper: host.currency === 'USD' ? 'Letter' : 'A4',
        }),
      )
      .then(pdf => {
        attachments.push({
          filename: pdf_filename,
          content: pdf,
        });
      })
      .then(() => getHostStats(host, Object.keys(collectivesById)))
      .then(stats => {
        stats.totalAmountPaid = {
          totalInHostCurrency:
            stats.totalAmountPaidExpenses.totalInHostCurrency +
            stats.paymentProcessorFees.totalInHostCurrency +
            stats.platformFees.totalInHostCurrency,
        };
        stats.totalAmountSpent = {
          totalInHostCurrency:
            stats.totalAmountPaidExpenses.totalInHostCurrency +
            stats.payoutProcessorFeesPaypal.totalInHostCurrency +
            stats.payoutProcessorFeesOther.totalInHostCurrency,
        };
        stats.totalHostRevenue = {
          totalInHostCurrency: stats.totalHostFees.totalInHostCurrency,
        };
        // Total net amount received on the host's bank account = total amount - payment processor fees and platform fees
        stats.totalNetAmountReceived = {
          totalInHostCurrency:
            stats.totalAmountDonations.totalInHostCurrency +
            stats.paymentProcessorFees.totalInHostCurrency +
            stats.platformFees.totalInHostCurrency,
        };

        data.stats = {
          ...data.stats,
          ...stats,
          totalActiveCollectives: Object.keys(_.keyBy(data.transactions, 'CollectiveId')).length,
          numberTransactions: data.transactions.length,
          numberDonations: data.transactions.length - data.stats.numberPaidExpenses,
        };
        summary.hosts.push({
          host: { name: host.name, slug: host.slug, currency: host.currency },
          stats: data.stats,
        });
        summary.totalActiveHosts++;
        summary.totalActiveCollectives += data.stats.totalActiveCollectives;
        summary.numberTransactions += data.stats.numberTransactions;
        summary.numberDonations += data.stats.numberDonations;
        summary.numberPaidExpenses += data.stats.numberPaidExpenses;
        summary.totalAmountPaidExpenses += data.stats.totalAmountPaidExpenses;

        // Don't send transactions in email if there is more than 1000
        if (data.transactions.length > 1000) {
          delete data.transactions;
        }
      })
      .then(() => getHostAdminsEmails(host))
      .then(admins => sendEmail(admins, data, attachments))
      .catch(e => {
        console.error(`Error in processing host ${host.slug}:`, e.message, e);
        debug(e);
      });
  };

  const sendEmail = (recipients, data, attachments) => {
    debug('Sending email to ', recipients);
    if (!recipients || recipients.length === 0) {
      console.error('Unable to send host report for ', data.host.slug, 'No recipient to send to');
      return;
    }
    // debug("email data transactions", data.transactions);
    debug('email data stats', data.stats);
    debug('email data stats.backers', data.stats.backers);
    const options = { attachments };
    return emailLib.send(emailTemplate, recipients, data, options);
  };

  const query = `
  with "hosts" as (SELECT DISTINCT "HostCollectiveId" AS id FROM "Collectives" WHERE "deletedAt" IS NULL AND "isActive" IS TRUE AND "HostCollectiveId" IS NOT NULL)
  SELECT c.* FROM "Collectives" c WHERE c.id IN (SELECT h.id FROM hosts h) ${previewCondition}
  `;

  const hosts = await sequelize.query(query, {
    model: models.Collective,
    type: sequelize.QueryTypes.SELECT,
  });
  console.log(`Preparing the ${reportName} for ${hosts.length} hosts`);

  return Promise.map(hosts, processHost, { concurrency: 1 }).then(() => {
    console.log('>>> All done. Exiting.');
    process.exit(0);
  });
}

export default HostReport;

#!/usr/bin/env node
import '../../server/env';

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
import models, { Op } from '../../server/models';
import { notifyAdminsOfCollective } from '../../server/lib/notifications';

const d = process.env.START_DATE ? new Date(process.env.START_DATE) : new Date();
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');
const year = d.getFullYear();
const dateFormat = 'YYYYMM';

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

console.log('startDate', startDate, 'endDate', endDate);

const debug = debugLib('monthlyreport');

const processCollectives = collectives => {
  return Promise.map(collectives, processCollective, { concurrency: 1 });
};

const init = () => {
  const startTime = new Date();

  const query = {
    attributes: ['id', 'slug', 'name', 'twitterHandle', 'currency', 'settings', 'tags'],
    where: { type: 'COLLECTIVE', isActive: true },
  };

  let slugs;
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
    slugs = [
      'vuejs',
      'webpack',
      'wwcodeaustin',
      'railsgirlsatl',
      'cyclejs',
      'mochajs',
      'chsf',
      'freeridetovote',
      'tipbox',
    ];
  }
  if (process.env.SLUGS) {
    slugs = process.env.SLUGS.split(',');
  }
  if (slugs) {
    query.where.slug = { [Op.in]: slugs };
  }

  models.Collective.findAll(query)
    .tap(collectives => {
      console.log(`Preparing the ${month} report for ${collectives.length} collectives`);
    })
    .then(processCollectives)
    .then(() => {
      const timeLapsed = Math.round((new Date() - startTime) / 1000);
      console.log(`Total run time: ${timeLapsed}s`);
      process.exit(0);
    });
};

const topBackersCache = {};
const getTopBackers = (startDate, endDate, tags) => {
  tags = tags || [];
  const cacheKey = `${startDate.getTime()}${endDate.getTime()}${tags.join(',')}`;
  if (topBackersCache[cacheKey]) {
    return Promise.resolve(topBackersCache[cacheKey]);
  } else {
    return models.Collective.getTopBackers(startDate, endDate, tags, 5)
      .then(backers => {
        if (!backers) {
          return [];
        }
        return Promise.map(backers, backer => processBacker(backer, startDate, endDate, tags));
      })
      .then(backers => {
        backers = _.without(backers, null);
        topBackersCache[cacheKey] = backers;
        return backers;
      });
  }
};

const formatCurrency = (amount, currency) => {
  return (amount / 100).toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const generateDonationsString = (backer, transactions) => {
  if (!backer.name) {
    debug(`Skipping ${backer.username} because it doesn't have a name (${backer.name})`);
    return;
  }
  const donationsTextArray = [],
    donationsHTMLArray = [];
  transactions = transactions.filter(order => order.amount > 0);
  if (transactions.length === 0) {
    debug(`Skipping ${backer.name} because there is no donation`);
    return;
  }
  for (let i = 0; i < Math.min(3, transactions.length); i++) {
    const transaction = transactions[i];
    donationsHTMLArray.push(
      `${formatCurrency(transaction.amount, transaction.currency)} to <a href="https://opencollective.com/${
        transaction.collective.slug
      }">${transaction.collective.name}</a>`,
    );
    donationsTextArray.push(
      `${formatCurrency(transaction.amount, transaction.currency)} to https://opencollective.com/${
        transaction.collective.slug
      }`,
    );
  }
  const joinStringArray = arr => {
    return arr.join(', ').replace(/,([^, ]*)$/, ' and $1');
  };
  return {
    html: joinStringArray(donationsHTMLArray),
    text: joinStringArray(donationsTextArray),
  };
};

const processBacker = (backer, startDate, endDate, tags) => {
  return backer
    .getLatestTransactions(startDate, endDate, tags)
    .then(transactions => generateDonationsString(backer, transactions))
    .then(donationsString => {
      backer.website = backer.slug
        ? `https://opencollective.com/${backer.slug}`
        : backer.website || backer.twitterHandle;
      if (!donationsString || !backer.website) {
        return null;
      }
      backer = _.pick(backer, ['name', 'slug', 'image', 'website']);
      backer.donationsString = donationsString;
      return backer;
    });
};

const processCollective = collective => {
  const promises = [
    getTopBackers(startDate, endDate, collective.tags),
    collective.getTiersWithUsers({
      attributes: ['id', 'slug', 'name', 'image', 'firstDonation', 'lastDonation', 'totalDonations', 'tier'],
      until: endDate,
    }),
    collective.getBalance(endDate),
    collective.getTotalTransactions(startDate, endDate, 'donation'),
    collective.getTotalTransactions(startDate, endDate, 'expense'),
    collective.getExpenses(null, startDate, endDate),
    collective.getRelatedCollectives(3, 0, 'c."createdAt"', 'DESC'),
    collective.getBackersStats(startDate, endDate),
    collective.getNewOrders(startDate, endDate, { status: { [Op.or]: ['ACTIVE', 'PAID'] } }),
    collective.getCancelledOrders(startDate, endDate),
    collective.getUpdates('published', startDate, endDate),
    collective.getNextGoal(endDate),
    collective.getTransactions({ startDate, endDate }),
  ];

  let emailData = {};
  const options = {};
  const csv_filename = `${collective.slug}-${moment(d).format(dateFormat)}-transactions.csv`;

  return Promise.all(promises)
    .then(results => {
      console.log('***', collective.name, '***');
      const data = {
        config: { host: config.host },
        month,
        year,
        collective: {},
      };
      data.topBackers = _.filter(results[0], backer => backer.donationsString.text.indexOf(collective.slug) === -1); // we omit own backers
      return getTiersStats(results[1], startDate, endDate).then(res => {
        data.collective = _.pick(collective, ['id', 'name', 'slug', 'currency', 'publicUrl']);
        data.collective.tiers = res.tiers;
        data.collective.backers = res.backers;
        data.collective.stats = results[7];
        data.collective.newOrders = results[8];
        data.collective.cancelledOrders = results[9];
        data.collective.stats.balance = results[2];
        data.collective.stats.totalDonations = results[3];
        data.collective.stats.totalExpenses = results[4];
        data.collective.expenses = results[5];
        data.relatedCollectives = (results[6] || []).map(c => {
          c.description = c.description || c.mission;
          return c;
        });
        data.collective.updates = results[10];
        data.collective.transactions = results[12];
        const nextGoal = results[11];
        if (nextGoal) {
          nextGoal.tweet = `🚀 ${collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name} is at ${
            nextGoal.percentage
          } of their next goal: ${nextGoal.title}.\nHelp us get there! 🙌\nhttps://opencollective.com/${
            collective.slug
          }`;
          data.collective.nextGoal = nextGoal;
        }

        if (data.collective.transactions && data.collective.transactions.length > 0) {
          const collectivesById = { [collective.id]: collective };
          const csv = models.Transaction.exportCSV(data.collective.transactions, collectivesById);

          options.attachments = [
            {
              filename: csv_filename,
              content: csv,
            },
          ];
        }

        emailData = data;
        return collective;
      });
    })
    .then(collective => {
      const activity = {
        type: 'collective.monthlyreport',
        data: emailData,
      };
      return notifyAdminsOfCollective(collective.id, activity, options);
    })
    .catch(e => {
      console.error('Error in processing collective', collective.slug, e);
    });
};

init();

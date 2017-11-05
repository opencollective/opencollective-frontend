#!/usr/bin/env node

// Only run on the first of the month
const today = new Date();
if (process.env.NODE_ENV === 'production' && today.getDate() !== 3) { // TODO: change back to 1
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
  Collective,
  Notification,
  User
} = models;

const processCollectives = (collectives) => {
    return Promise.map(collectives, processCollective, { concurrency: 1 });
};


const init = () => {

  const startTime = new Date;

  const query = {
      attributes: [
          'id',
          'slug',
          'name',
          'currency',
          'tags'
      ],
      where: { type: 'COLLECTIVE'},
      include: [ { model: models.Transaction, required: true }]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    query.where.slug = { $in: ['vuejs', 'webpack', 'wwcodeaustin','railsgirlsatl','cyclejs','mochajs','chsf','freeridetovote','tipbox'] };
  // query.where.slug = { $in: ['vuejs'] };

  Collective.findAll(query)
  .tap(collectives => {
      console.log(`Preparing the ${month} report for ${collectives.length} collectives`);
  })
  .then(processCollectives)
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0)
  });
}

const topBackersCache = {};
const getTopBackers = (startDate, endDate, tags) => {
  tags = tags || [];
  const cacheKey = `${startDate.getTime()}${endDate.getTime()}${tags.join(',')}`;
  if (topBackersCache[cacheKey]) return Promise.resolve(topBackersCache[cacheKey]);
  else {
    return Collective.getTopBackers(startDate, endDate, tags, 5)
      .then(backers => {
        if (!backers) return []; 
        return Promise.map(backers, backer => processBacker(backer, startDate, endDate, tags))
      })
      .then(backers => {
        backers = _.without(backers, null)
        topBackersCache[cacheKey] = backers;
        return backers;
    });
  }
};

const formatCurrency =  (amount, currency) => {
  return (amount / 100).toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 0,
    maximumFractionDigits : 2
  })
}

const generateDonationsString = (backer, orders) => {
  if (!backer.name) {
    debug(`Skipping ${backer.username} because it doesn't have a name (${backer.name})`);
    return;
  }
  const donationsTextArray = [], donationsHTMLArray = [];
  orders = orders.filter(order => (order.totalAmount > 0));
  if (orders.length === 0) {
    debug(`Skipping ${backer.name} because there is no donation`);
    return;
  }
  for (let i=0; i<Math.min(3, orders.length); i++) {
    const order = orders[i];
    donationsHTMLArray.push(`${formatCurrency(order.totalAmount, order.currency)} to <a href="https://opencollective.com/${order.Collective.slug}">${order.Collective.name}</a>`);
    donationsTextArray.push(`${formatCurrency(order.totalAmount, order.currency)} to https://opencollective.com/${order.Collective.slug}`);
  }
  const joinStringArray = (arr) => {
    return arr.join(', ').replace(/,([^, ]*)$/,' and $1');
  }
  return {
    html: joinStringArray(donationsHTMLArray),
    text: joinStringArray(donationsTextArray)
  };
};

const processBacker = (backer, startDate, endDate, tags) => {
  return backer.getLatestDonations(startDate, endDate, tags)
    .then((donations) => generateDonationsString(backer, donations))
    .then(donationsString => {
      backer.website = (backer.slug) ? `https://opencollective.com/${backer.slug}` : backer.website || backer.twitterHandle;
      if (!donationsString || !backer.website) return null;
      backer = _.pick(backer, ['name','slug','image','website']);
      backer.donationsString = donationsString;
      return backer;
    })
};

const processCollective = (collective) => {
  const promises = [
    getTopBackers(startDate, endDate, collective.tags),
    collective.getTiersWithUsers({ attributes: ['id', 'slug', 'name', 'image', 'firstDonation', 'lastDonation', 'totalDonations', 'tier'], until: endDate }),
    collective.getBalance(endDate),
    collective.getTotalTransactions(startDate, endDate, 'donation'),
    collective.getTotalTransactions(startDate, endDate, 'expense'),
    collective.getExpenses(null, startDate, endDate),
    collective.getRelatedCollectives(3, 0, 'c."createdAt"', 'DESC'),
    collective.getBackersStats(startDate, endDate)    
  ];

  let emailData = {};

  return Promise.all(promises)
          .then(results => {
            console.log('***', collective.name, '***');
            const data = { config: { host: config.host }, month, collective: {} };
            data.topBackers = _.filter(results[0], (backer) => (backer.donationsString.text.indexOf(collective.slug) === -1)); // we omit own backers
            return getTiersStats(results[1], startDate, endDate)
              .then(res => {
                data.collective = _.pick(collective, ['id', 'name', 'slug', 'currency','publicUrl']);
                data.collective.tiers = res.tiers;
                data.collective.stats = results[7];
                data.collective.stats.balance = results[2];
                data.collective.stats.totalDonations = results[3];
                data.collective.stats.totalExpenses = results[4];
                data.collective.expenses = results[5];
                data.relatedCollectives = results[6];
                emailData = data;
                return collective;
              });
          })
          .then(getRecipients)
          .then(recipients => sendEmail(recipients, emailData))
          .catch(e => {
            console.error("Error in processing collective", collective.slug, e);
          });
};

const getRecipients = (collective) => {
  return Notification.findAll({
    where: {
      CollectiveId: collective.id,
      type: 'collective.monthlyreport'
    },
    include: [{ model: User }]
  }).then(results => results.map(r => r.User.dataValues));
}

const sendEmail = (recipients, data) => {
  if (recipients.length === 0) return;
  return Promise.map(recipients, recipient => {
    if (!recipient.email) {
      return Promise.resolve();
    }
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('collective.monthlyreport', recipient.email, data);
  });
}

init();

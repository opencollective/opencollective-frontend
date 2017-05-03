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
  Notification,
  User
} = models;

const processGroups = (groups) => {
    return Promise.map(groups, processGroup);
};


const init = () => {

  const startTime = new Date;

  const query = {
      attributes: [
          'id',
          'slug',
          'name',
          'currency',
          'tiers',
          'tags'
      ],
      include: [ { model: models.Transaction, required: true }]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    query.where = { slug: {$in: ['webpack', 'wwcodeaustin','railsgirlsatl','cyclejs','mochajs','chsf','freeridetovote','tipbox']} };

  Group.findAll(query)
  .tap(groups => {
      console.log(`Preparing the ${month} report for ${groups.length} groups`);
  })
  .then(processGroups)
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
    return User.getTopBackers(startDate, endDate, tags, 5)
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

const generateDonationsString = (backer, donations) => {
  if (!backer.name) {
    debug(`Skipping ${backer.username} because it doesn't have a name (${backer.name})`);
    return;
  }
  const donationsTextArray = [], donationsHTMLArray = [];
  donations = donations.filter(donation => (donation.amount > 0));
  if (donations.length === 0) {
    debug(`Skipping ${backer.name} because there is no donation`);
    return;
  }
  for (let i=0; i<Math.min(3, donations.length); i++) {
    const donation = donations[i];
    donationsHTMLArray.push(`${formatCurrency(donation.amount,donation.currency)} to <a href="https://opencollective.com/${donation.Group.slug}">${donation.Group.name}</a>`);
    donationsTextArray.push(`${formatCurrency(donation.amount,donation.currency)} to https://opencollective.com/${donation.Group.slug}`);
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
      backer.website = (backer.username) ? `https://opencollective.com/${backer.username}` : backer.website || backer.twitterHandle;
      if (!donationsString || !backer.website) return null;
      backer = _.pick(backer, ['name','username','avatar','website']);
      backer.donationsString = donationsString;
      return backer;
    })
};

const processGroup = (group) => {
  const promises = [
    getTopBackers(startDate, endDate, group.tags),
    group.getTiersWithUsers({ attributes: ['id','username','name', 'avatar','firstDonation','lastDonation','totalDonations','tier'], until: endDate }),
    group.getBalance(endDate),
    group.getTotalTransactions(startDate, endDate, 'donation'),
    group.getTotalTransactions(startDate, endDate, 'expense'),
    group.getExpenses(null, startDate, endDate),
    group.getRelatedGroups(3, 0, 'g."createdAt"', 'DESC')
  ];

  let emailData = {};

  return Promise.all(promises)
          .then(results => {
            console.log('***', group.name, '***');
            const data = { config: { host: config.host }, month, group: {} };
            data.topBackers = _.filter(results[0], (backer) => (backer.donationsString.text.indexOf(group.slug) === -1)); // we omit own backers
            const res = getTiersStats(results[1], startDate, endDate);
            data.group = _.pick(group, ['id', 'name', 'slug', 'currency','publicUrl']);
            data.group.tiers = res.tiers;
            data.group.stats = res.stats;
            data.group.stats.balance = results[2];
            data.group.stats.totalDonations = results[3];
            data.group.stats.totalExpenses = results[4];
            data.group.expenses = results[5];
            data.relatedGroups = results[6];
            emailData = data;
            console.log(data.group.stats);
            return group;
          })
          .then(getRecipients)
          .then(recipients => sendEmail(recipients, emailData))
          .catch(e => {
            console.error("Error in processing group", group.slug, e);
          });
};

const getRecipients = (group) => {
  return Notification.findAll({
    where: {
      GroupId: group.id,
      type: 'group.monthlyreport'
    },
    include: [{ model: User }]
  }).then(results => results.map(r => r.User.dataValues));
}

const sendEmail = (recipients, data) => {
  if (recipients.length === 0) return;
  return Promise.map(recipients, recipient => {
    data.recipient = recipient;
    if (process.env.ONLY && recipient.email !== process.env.ONLY) {
      debug("Skipping ", recipient.email);
      return Promise.resolve();
    }
    return emailLib.send('group.monthlyreport', recipient.email, data);
  });
}

init();

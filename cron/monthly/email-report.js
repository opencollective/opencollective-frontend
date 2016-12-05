#!/usr/bin/env node

process.env.PORT = 3066;

import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import { isBackerActive } from '../../server/lib/utils';
import models from '../../server/models';
import emailLib from '../../server/lib/email';

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');

const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
const endDate = new Date(d.getFullYear(), d.getMonth()+1, 0);

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
    // query.where = { slug: {$in: ['webpack', 'wwcodeaustin']} };

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
  return amount.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 0,
    maximumFractionDigits : 2
  })
}

const generateDonationsString = (backer, donations) => {
  if (!backer.name) {
    debug(`Skipping ${backer.name} because it doesn't have a name (${backer.username})`);
    return;
  }
  const donationsArray = [];
  donations = donations.filter(donation => (donation.amount > 0));
  let donationsString;
  for (let i=0; i<Math.min(3, donations.length); i++) {
    const donation = donations[i];
    donationsArray.push(`${formatCurrency(donation.amount,donation.currency)} to <a href="https://opencollective.com/${donation.Group.slug}">${donation.Group.name}</a>`);
  }
  donationsString = donationsArray.join(', ');
  donationsString = donationsString.replace(/,([^, ]*)$/,' and $1');
  return donationsString;
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

const rank = (user) => {
  if (user.isNew) return 1;
  if (user.isLost) return 2;
  return 3;
};

const processTiers = (tiers) => {

  const userids = {};
  const stats = { backers: {} };

  stats.backers.lastMonth = 0;
  stats.backers.previousMonth = 0;
  stats.backers.new = 0;
  stats.backers.lost = 0;

  // We only keep the tiers that have at least one user
  tiers = tiers.filter(tier => tier.users.length > 0 && tier.name != 'host' && tier.name != 'core contributor');

  // We sort tiers by number of users ASC
  tiers.sort((a,b) => b.range[0] - a.range[0]);

  tiers = tiers.map(tier => {

    let index = 0
    debug("> processing tier ", tier.name);

    // We sort users by total donations DESC
    tier.users.sort((a,b) => b.totalDonations - a.totalDonations );

    tier.users = tier.users.filter(u => {
      if (userids[u.id]) {
        debug(">>> user ", u.username, "is a duplicate");
        return false;
      }
      userids[u.id] = true;

      u.index = index++;
      u.activeLastMonth = isBackerActive(u, tiers, endDate);
      u.activePreviousMonth = (u.firstDonation < startDate) && isBackerActive(u, tiers, startDate);

      if (tier.name.match(/sponsor/i))
        u.isSponsor = true;
      if (u.firstDonation > startDate) {
        u.isNew = true;
        stats.backers.new++;
      }
      if (u.activePreviousMonth && !u.activeLastMonth) {
        u.isLost = true;
        stats.backers.lost++;
      }

      debug("----------- ", u.username, "----------");
      debug("firstDonation", u.firstDonation && u.firstDonation.toISOString().substr(0,10));
      debug("totalDonations", u.totalDonations/100);
      debug("active last month?", u.activeLastMonth);
      debug("active previous month?", u.activePreviousMonth);
      debug("is new?", u.isNew === true);
      debug("is lost?", u.isLost === true);
      if (u.activePreviousMonth)
        stats.backers.previousMonth++;
      if (u.activeLastMonth) {
        stats.backers.lastMonth++;
        return true;
      } else if (u.isLost) {
        return true;
      }
    });

    tier.users.sort((a, b) => {
      if (rank(a) > rank(b)) return 1;
      if (rank(a) < rank(b)) return -1;
      return a.index - b.index; // make sure we keep the original order within a tier (typically totalDonations DESC)
    });

    return tier;
  });
  return { stats, tiers};
}

const processGroup = (group) => {
  const promises = [
    getTopBackers(startDate, endDate, group.tags),
    group.getTiersWithUsers({ attributes: ['id','username','name', 'avatar','firstDonation','lastDonation','totalDonations','tier'], until: endDate }),
    group.getBalance(endDate),
    group.getTotalTransactions(startDate, endDate, 'donation'),
    group.getTotalTransactions(startDate, endDate, 'expense'),
    group.getExpenses(null, startDate, endDate),
    group.getRelatedGroups(3)
  ];

  let emailData = {};

  return Promise.all(promises)
          .then(results => {
            console.log('***', group.name, '***');
            const data = { config: { host: config.host }, month, group: {} };
            data.topBackers = _.filter(results[0], (backer) => (backer.donationsString.indexOf(group.slug) === -1)); // we omit own backers
            const res = processTiers(results[1]);
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
    return emailLib.send('group.monthlyreport', recipient.email, data);
  });
}

init();

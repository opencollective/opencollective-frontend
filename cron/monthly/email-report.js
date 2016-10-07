#!/usr/bin/env node

process.env.PORT = 3066;

import _ from 'lodash';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';

import models from '../../server/models';
import emailLib from '../../server/lib/email';

const debug = debugLib('monthlyreport');

const {
  Group,
  Notification,
  User
} = models;

const processGroups = (groups) => {
    return Promise.map(groups, processGroup);
};

const d = new Date;
d.setMonth(d.getMonth() - 1);
const month = moment(d).format('MMMM');

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
      include: [ { model: models.Transaction, required: true }]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    query.limit = 10;

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
  let donationsString;
  donations.map(donation => {
    donationsArray.push(`${formatCurrency(donation.amount,donation.currency)} to <a href="https://opencollective.com/${donation.Group.slug}">${donation.Group.name}</a>`);
  });
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

const processGroup = (group) => {
  const d = new Date;
  const startDate = new Date(d.getFullYear(), d.getMonth() -1, 1);
  const endDate = new Date(d.getFullYear(), d.getMonth(), 0);
  debug(`Processing ${group.name}`, moment(startDate).format('MM/DD'), moment(endDate).format('MM/DD'));
  const promises = [
    group.getBalance(endDate),
    group.getBalance(startDate),
    group.getBackersCount(endDate),
    group.getBackersCount(startDate),
    group.getExpenses(null, startDate, endDate),
    group.getRelatedGroups(3),
    getTopBackers(startDate, endDate, group.tags)
  ];

  let emailData = {};

  return Promise.all(promises)
          .then(results => {
            const data = { config: { host: config.host }, month, group: {} };
            data.group = _.pick(group, ['id', 'name', 'slug', 'currency','publicUrl']);
            data.group.balance = results[0];
            data.group.previousBalance = results[1];
            data.group.balanceDelta = results[0] - results[1];
            data.group.backersCount = results[2];
            data.group.backersCountDelta = results[2] - results[3];
            data.group.expenses = results[4].map(e => _.pick(e.dataValues, ['id', 'description', 'status', 'createdAt','netAmountInGroupCurrency','currency']));
            data.group.related = results[5];
            data.topBackers = _.filter(results[6], (backer) => (backer.donationsString.indexOf(group.slug) === -1)); // we omit own backers
            emailData = data;
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
  debug(`Preview email template: http://localhost:3060/templates/email/group.monthlyreport?data=${encodeURIComponent(JSON.stringify(data))}`);
  return Promise.map(recipients, recipient => {
    debug("Sending email to ", recipient.email);
    return emailLib.send('group.monthlyreport', recipient.email, data);
  });
}

init();

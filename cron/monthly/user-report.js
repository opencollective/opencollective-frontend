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
  Collective,
  Expense,
  Notification,
  Subscription,
  User
} = models;


const init = () => {

  const startTime = new Date;

  const where = {};
  const query = {
    where: {
      type: 'user.monthlyreport',
      active: true
    },
    include: [{ model: User, where }]
  };

  if (process.env.DEBUG && process.env.DEBUG.match(/preview/))
    where.username = {$in: ['xdamman','piamancini', 'aseem']};

  Notification.findAll(query)
  .then(results => results.map(r => r.User))
  .tap(users => {
      console.log(`Preparing the ${month} report for ${users.length} users`);
  })
  .then(users => Promise.map(users, processUser))
  .then(() => {
    const timeLapsed = Math.round((new Date - startTime)/1000);
    console.log(`Total run time: ${timeLapsed}s`);
    process.exit(0)
  });
}

const now = new Date;
const processEvents = (events) => {
  const res = {
    upcoming: [],
    past: []
  };

  events.forEach(event => {
    event.stats = { confirmed: 0, interested: 0 };
    event.Responses.forEach(response => {
      if (response.status === 'INTERESTED') {
        event.stats.interested++;
      }
      if (response.status === 'YES') {
        event.stats.confirmed++;
      }
    })

    if (new Date(event.startsAt) > now) {
      res.upcoming.push(event);
    } else {
      res.past.push(event);
    }
  })
  return res;
};

const collectivesData = {};
const processCollective = (collective) => {
  if ( collectivesData[collective.slug]) return collectivesData[collective.slug];

  const promises = [
    collective.getTiersWithUsers({ attributes: ['id','username','name', 'image','firstDonation','lastDonation','totalDonations','tier'], until: endDate }),
    collective.getBalance(endDate),
    collective.getTotalTransactions(startDate, endDate, 'donation'),
    collective.getTotalTransactions(startDate, endDate, 'expense'),
    collective.getExpenses(null, startDate, endDate),
    collective.getYearlyIncome(),
    Expense.findAll({ where: { CollectiveId: collective.id, createdAt: { $gte: startDate, $lt: endDate } }, limit: 3, order: [['id', 'DESC']], include: [ {model: User} ]}),
    collective.getEvents({ where: { CollectiveId: collective.id, startsAt: { $gte: startDate } }, order: [['startsAt', 'DESC']], include: [ {model: models.Response} ]})
  ];

  return Promise.all(promises)
          .then(results => {
            console.log('***', collective.name, '***');
            const data = {};
            data.collective = _.pick(collective, ['id', 'name', 'slug', 'website', 'image', 'mission', 'currency','publicUrl', 'tags', 'backgroundImage', 'settings', 'totalDonations', 'contributorsCount']);
            const res = getTiersStats(results[0], startDate, endDate);
            data.collective.stats = res.stats;
            data.collective.stats.balance = results[1];
            data.collective.stats.totalDonations = results[2];
            data.collective.stats.totalPaidExpenses = -results[3];
            data.collective.contributorsCount = (collective.data && collective.data.githubContributors) ? Object.keys(collective.data.githubContributors).length : data.collective.stats.backers.lastMonth;
            data.collective.yearlyIncome = results[5];
            data.collective.expenses = results[6];
            data.collective.events = processEvents(results[7]);
            console.log(data.collective.stats);
            collectivesData[collective.slug] = data.collective;
            return collective;
          })
          .catch(e => {
            console.error("Error in processing collective", collective.slug, e);
          });
};


const processUser = (user) => {

let subscriptions, tags;

 return user.getDonations({
   include: [
     { model: Collective },
     { model: Subscription, where: { isActive: true } }
   ]
  })
  .tap(donations => Promise.map(donations, s => processCollective(s.Collective)))
  .then(donations => donations.map(s => {
    const subscription = _.pick(s.Subscription, ['amount', 'interval', 'currency', 'createdAt']);
    subscription.collective = collectivesData[s.Collective.slug];
    tags = _.union(tags, subscription.collective.tags);
    return subscription;
    })
  )
  .tap(s => subscriptions = s)
  .then(() => Collective.getCollectivesSummaryByTag(tags, 3, null, 0, false, 'g."createdAt"', 'DESC'))
  .then(relatedCollectives => {
    return {
      config: { host: config.host },
      month,
      subscriptions,
      manageSubscriptionsUrl: user.generateLoginLink('/subscriptions'),
      relatedCollectives
    }
  })
  .then(data => sendEmail(user, data))
};


const sendEmail = (recipient, data) => {
  if (recipient.length === 0) return;
  data.recipient = recipient;
  if (process.env.ONLY && recipient.email !== process.env.ONLY) {
    debug("Skipping ", recipient.email);
    return Promise.resolve();
  }

  // We don't send the monthly email if there is no active subscription
  if (!data.subscriptions || data.subscriptions.length === 0) return;

  if (process.env.SEND_EMAIL_TO) {
    recipient.email = process.env.SEND_EMAIL_TO;
  }

  return emailLib.send('user.monthlyreport', recipient.email, data);
}

init();

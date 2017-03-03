#!/usr/bin/env node

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
  Subscription,
  User
} = models;


const init = () => {

  const startTime = new Date;

  const where = {};
  const query = {
    where: {
      type: 'backer.monthlyreport',
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

const groupsData = {};
const processGroup = (group) => {
  if ( groupsData[group.slug]) return groupsData[group.slug];

  const promises = [
    group.getTiersWithUsers({ attributes: ['id','username','name', 'avatar','firstDonation','lastDonation','totalDonations','tier'], until: endDate }),
    group.getBalance(endDate),
    group.getTotalTransactions(startDate, endDate, 'donation'),
    group.getTotalTransactions(startDate, endDate, 'expense'),
    group.getExpenses(null, startDate, endDate),
    group.getYearlyIncome()
  ];

  return Promise.all(promises)
          .then(results => {
            console.log('***', group.name, '***');
            const data = {};
            data.group = _.pick(group, ['id', 'name', 'slug', 'logo', 'mission', 'currency','publicUrl', 'tags', 'backgroundImage', 'settings', 'totalDonations', 'contributorsCount']);
            const res = getTiersStats(results[0], startDate, endDate);
            data.group.stats = res.stats;
            data.group.stats.balance = results[1];
            data.group.stats.totalDonations = results[2];
            data.group.stats.totalExpenses = results[3];
            data.group.contributorsCount = (group.data && group.data.githubContributors) ? Object.keys(group.data.githubContributors).length : data.group.stats.backers.lastMonth;
            data.group.yearlyIncome = results[5];
            console.log(data.group.stats);
            groupsData[group.slug] = data.group;
            console.log("group", data.group);
            return group;
          })
          .catch(e => {
            console.error("Error in processing group", group.slug, e);
          });
};


const processUser = (user) => {

let subscriptions, tags;

 return user.getDonations({
   include: [
     { model: Group },
     { model: Subscription, where: { isActive: true } }
   ]
  })
  .tap(donations => Promise.map(donations, s => processGroup(s.Group)))
  .then(donations => donations.map(s => {
    const subscription = _.pick(s.Subscription, ['amount', 'interval', 'currency', 'createdAt']);
    subscription.group = groupsData[s.Group.slug];
    tags = _.union(tags, subscription.group.tags);
    return subscription;
    })
  )
  .tap(s => subscriptions = s)
  .then(() => Group.getGroupsSummaryByTag(tags, 3, null, 0, false, 'g."createdAt"', 'DESC'))
  .then(relatedGroups => {
    return {
      config: { host: config.host },
      month,
      subscriptions,
      manageSubscriptionsUrl: user.generateLoginLink('/subscriptions'),
      relatedGroups
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

  return emailLib.send('backer.monthlyreport', recipient.email, data);
}

init();

#!/usr/bin/env node

process.env.PORT = 3066;

import _ from 'lodash';
import app  from '../../index';
import moment from 'moment';
import config from 'config';
import Promise from 'bluebird';

const emailLib = require('../../server/lib/email');
const debug = require('debug')('monthlyreport');

const Group = app.set('models').Group;
const User = app.set('models').User;
const Notification = app.set('models').Notification;

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
      where: {
        slug: 'railsgirlsatl'
      }
  };

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
    group.getRelatedGroups(3)
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
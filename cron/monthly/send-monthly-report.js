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

  const query = {
      attributes: [
          'id',
          'slug',
          'name',
          'currency'
      ],
      where: {
        slug: { $in: ['railsgirlsatl'] } // for testing
      },
      limit: 1 // for testing
  };

  Group.findAll(query)
  .tap(groups => {
      debug(`Preparing the ${month} report for ${groups.length} groups`);
  })
  .then(processGroups)
  .then(() => process.exit(0));
}

const processGroup = (group) => {
  const d = new Date;
  const startDate = new Date(d.getFullYear(), d.getMonth() -1, 1);
  const endDate = new Date(d.getFullYear(), d.getMonth(), 0);
  debug(`Processing ${group.name}`, moment(startDate).format('MM/DD'), moment(endDate).format('MM/DD'));
  const promises = [
    group.getBalance(),
    group.getBalance(endDate),
    group.getBackersCount(),
    group.getBackersCount(endDate),
    group.getExpenses(null, startDate, endDate)
  ];

  let emailData = {};

  return Promise.all(promises)
          .then(results => {
            const data = { config, month, group: {} };
            data.group = _.pick(group, ['id', 'name', 'slug', 'currency']);
            data.group.balance = results[0];
            data.group.previousBalance = results[1];
            data.group.balanceDelta = results[0] - results[1];
            data.group.backersCount = results[2];
            data.group.backersCountDelta = results[2] - results[3];
            data.group.expenses = results[4].map(e => e.dataValues);
            emailData = data;
            return group;
          })
          .then(getRecipients)
          .then(recipients => sendEmail(recipients, emailData));
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
  // debug(`Preview email template: http://localhost:3060/templates/email/group.monthlyreport?data=${encodeURIComponent(JSON.stringify(data))}`);
  recipients.map(recipient => {
    debug("Sending email to ", recipient);
    return emailLib.send('group.monthlyreport', recipient.email, data);
  });
}

init();
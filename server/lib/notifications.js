import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';

import { get } from 'lodash';
import activitiesLib from '../lib/activities';
import slackLib from './slack';
import twitter from './twitter';
import emailLib from '../lib/email';
import activityType from '../constants/activities';
import models from '../models';
import debugLib from 'debug';
const debug = debugLib("notification");

export default async (Sequelize, activity) => {
  // publish everything to our private channel
  publishToSlackPrivateChannel(activity)

  // publish a filtered version to our public channel
  publishToSlack(activity, config.slack.webhookUrl, { channel: config.slack.publicActivityChannel });
  
  notifyByEmail(activity);

  // process notification entries for slack, twitter, gitter
  if (!activity.CollectiveId || !activity.type) {
    return;
  }
  const where = {
    CollectiveId: activity.CollectiveId,
    type: [
      activityType.ACTIVITY_ALL,
      activity.type
    ],
    channel: ['gitter', 'slack', 'twitter'],
    active: true
  };

  const notificationChannels = await models.Notification.findAll({ where })

  return Promise.map(notificationChannels, notifConfig => {
    if (notifConfig.channel === 'gitter') {
      return publishToGitter(activity, notifConfig);
    } else if (notifConfig.channel === 'slack') {
      return publishToSlack(activity, notifConfig.webhookUrl, {});
    } else if (notifConfig.channel === 'twitter') {
      return twitter.tweetActivity(activity);
    } else {
      return Promise.resolve();
    }
  })
  .catch(err => {
    console.error(`Error while publishing activity type ${activity.type} for collective ${activity.CollectiveId}`, activity, "error: ", err);
  });
};

function publishToGitter(activity, notifConfig) {
  const message = activitiesLib.formatMessageForPublicChannel(activity, 'markdown');
  if (message && process.env.NODE_ENV === 'production') {
    return axios.post(notifConfig.webhookUrl, { message });
  } else {
    Promise.resolve();
  }
}

function publishToSlack(activity, webhookUrl, options) {
  return slackLib.postActivityOnPublicChannel(activity, webhookUrl, options);
}

function publishToSlackPrivateChannel(activity) {
  return slackLib.postActivityOnPrivateChannel(activity);
}

/**
 * Send the notification email (using emailLib.sendMessageFromActivity)
 * to all users that have not unsubscribed
 * @param {*} users: [ { id, email, firstName, lastName }]
 * @param {*} activity [ { type, CollectiveId }]
 */
async function notifySubscribers(users, activity, options={}) {
  const { data } = activity;
  if (!users || users.length === 0) {
    debug("notifySubscribers: no user to notify for activity", activity.type);
    return;
  }
  debug("notifySubscribers", users.length, users.map(u => u && u.email, activity.type));
  const unsubscribedUserIds = await models.Notification.getUnsubscribersUserIds(activity.type, activity.CollectiveId);
  debug("unsubscribedUserIds", unsubscribedUserIds);
  return users.map(u => {
    if (!u) return;
    // skip users that have unsubscribed
    if (unsubscribedUserIds.indexOf(u.id) === -1) {
      debug("sendMessageFromActivity", activity.type, "UserId", u.id);

      switch (activity.type) {
        case activityType.COLLECTIVE_EXPENSE_CREATED:
          data.actions = {
            approve: u.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/approve`),
            reject: u.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/reject`)
          };
          break;

        case activityType.COLLECTIVE_CREATED:
          data.actions = {
            approve: u.generateLoginLink(`/${data.host.slug}/collectives/${data.collective.id}/approve`)
          };
          break;
      }
      return emailLib.send(options.template || activity.type, u.email, data, options)
    }
  });
}

async function notifyUserId(UserId, activity, options) {
  const user = await models.User.findById(UserId);
  debug("notifyUserId", UserId, user.email);
  return emailLib.send(activity.type, user.email, activity.data, options);
}

async function notifyAdminsOfCollective(CollectiveId, activity, options) {
  debug("notify admins of CollectiveId", CollectiveId);
  const collective = await models.Collective.findById(CollectiveId)
  const adminUsers = await collective.getAdminUsers();
  debug("Total users to notify:", adminUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(adminUsers, activity, options);
}

async function notifyMembersOfCollective(CollectiveId, activity, options) {
  debug("notify members of CollectiveId", CollectiveId);
  const collective = await models.Collective.findById(CollectiveId)
  const allUsers = await collective.getUsers();
  debug("Total users to notify:", allUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(allUsers, activity, options);
}

async function notifyByEmail(activity) {
  debug("notifyByEmail", activity.type);
  debugLib("activity.data")("activity.data", activity.data);
  switch (activity.type) {

    case activityType.COLLECTIVE_UPDATE_PUBLISHED:
      twitter.tweetActivity(activity);
      activity.data.update = await models.Update.findById(activity.data.update.id, {
        include: [ { model: models.Collective, as: "fromCollective" } ]
      });
      notifyMembersOfCollective(activity.data.update.CollectiveId, activity, { from: `hello@${activity.data.collective.slug}.opencollective.com` });
      break;

    case activityType.SUBSCRIPTION_CANCELED:
      return notifyUserId(activity.UserId, activity, { cc: `info@${activity.data.collective.slug}.opencollective.com` });

    case activityType.COLLECTIVE_MEMBER_CREATED:
      twitter.tweetActivity(activity);
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_EXPENSE_CREATED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_EXPENSE_APPROVED:
      activity.data.actions = {
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`
      };
      if (get(activity, 'data.expense.payoutMethod') === 'paypal') {
        activity.data.expense.payoutMethod = `PayPal (${activity.data.user.paypalEmail})`;
      }
      notifyUserId(activity.data.expense.UserId, activity);
      notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.approved.for.host' })
      break;

    case activityType.COLLECTIVE_EXPENSE_PAID:
      activity.data.actions = {
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`
      }
      notifyUserId(activity.data.expense.UserId, activity);
      notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.paid.for.host' })
      break;

    case activityType.COLLECTIVE_CREATED:
      notifyAdminsOfCollective(activity.data.host.id, activity);
      break;

  }
}
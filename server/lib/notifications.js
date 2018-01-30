import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';

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
async function notifySubscribers(users, activity, options) {
  debug("notifySubscribers", users.length, users.map(u => u.email), activity.type);
  if (!users || users.length === 0) {
    debug("notifySubscribers: no user to notify");
    return;
  }
  const unsubscribedUserIds = await models.Notification.getUnsubscribersUserIds(activity.type, activity.CollectiveId);
  debug("unsubscribedUserIds", unsubscribedUserIds);
  return users.map(u => {
    // skip users that have unsubscribed
    if (unsubscribedUserIds.indexOf(u.id) === -1) {
      debug("sendMessageFromActivity", activity.type, "UserId", u.id);
      return emailLib.sendMessageFromActivity(activity, {
        UserId: u.id,
        User: u
      }, options);
    }
  });
}

async function notifyUserId(UserId, activity) {
  const user = await models.User.findById(UserId);
  debug("notifyUserId", UserId, user.email);
  return emailLib.sendMessageFromActivity(activity, {
    UserId: UserId,
    User: user
  });
}

async function notifyAdminsOfCollective(CollectiveId, activity, options) {
  debug("notifyAdminsOfCollective", CollectiveId);
  const collective = await models.Collective.findById(CollectiveId)
  const adminUsers = await collective.getAdminUsers();
  activity.CollectiveId = collective.id;
  return notifySubscribers(adminUsers, activity, options);
}

async function notifyByEmail(activity) {
  debug("notifyByEmail", activity.type);
  debugLib("activity.data")("activity.data", activity.data);
  switch (activity.type) {

    case activityType.SUBSCRIPTION_CANCELED:
      return emailLib.sendMessageFromActivity(activity);

    case activityType.COLLECTIVE_MEMBER_CREATED:
      twitter.tweetActivity(activity);
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_TRANSACTION_CREATED:
    case activityType.COLLECTIVE_EXPENSE_CREATED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_EXPENSE_APPROVED:
      notifyUserId(activity.data.expense.UserId, activity);
      notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.approved.for.host' })
      break;

    case activityType.COLLECTIVE_EXPENSE_PAID:
      notifyUserId(activity.data.expense.UserId, activity);
      notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.paid.for.host' })
      break;

    case activityType.COLLECTIVE_CREATED:
      notifyAdminsOfCollective(activity.data.host.id, activity);
      break;

  }
}
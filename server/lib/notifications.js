import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';

import activitiesLib from '../lib/activities';
import slackLib from './slack';
import {tweetActivity} from './twitter';
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
      return tweetActivity(Sequelize, activity);
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
async function notifySubscribers(users, activity) {
  debug("notifySubscribers", users.length, users, activity);
  const unsubscriptions = await models.Notification.findAll({
    where: {
      CollectiveId: activity.CollectiveId,
      type: activity.type,
      active: false
    }
  });
  const unsubscribedUserIds = unsubscriptions.map(n => n.UserId);
  debug("Skipping unsubscribedUserIds", unsubscribedUserIds);
  return users.map(u => {
    // skip users that have unsubscribed
    if (unsubscribedUserIds.indexOf(u.id) === -1) {
      return emailLib.sendMessageFromActivity(activity, {
        UserId: u.id,
        User: u
      });
    }
  });
}

async function notifyAdminsOfCollective(CollectiveId, activity) {
  const collective = await models.Collective.findById(CollectiveId)
  const admins = await collective.getAdmins();
  const adminUsers = await models.User.findAll({
    where: {
      CollectiveId: { $in: admins.map(a => a.id) }
    }
  });
  activity.CollectiveId = collective.id;
  return notifySubscribers(adminUsers, activity);
}

async function notifyByEmail(activity) {

  switch (activity.type) {

    case activityType.SUBSCRIPTION_CANCELED:
      return emailLib.sendMessageFromActivity(activity);

    case activityType.COLLECTIVE_MEMBER_CREATED:
    case activityType.COLLECTIVE_TRANSACTION_CREATED:
    case activityType.COLLECTIVE_EXPENSE_CREATED:
      return await notifyAdminsOfCollective(activity.data.collective.id, activity);

    case activityType.COLLECTIVE_EXPENSE_APPROVED:
    case activityType.COLLECTIVE_CREATED:
      return await notifyAdminsOfCollective(activity.data.host.id, activity);

  }
}
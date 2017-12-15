import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';

import activitiesLib from '../lib/activities';
import slackLib from './slack';
import {tweetActivity} from './twitter';
import emailLib from '../lib/email';
import activityType from '../constants/activities';
import models from '../models';

export default (Sequelize, activity) => {
  // publish everything to our private channel
  return publishToSlackPrivateChannel(activity)

    // publish a filtered version to our public channel
    .then(() => publishToSlack(activity, config.slack.webhookUrl,
      {
        channel: config.slack.publicActivityChannel
      }))
  
    // process certain types of notifications without a notification entry
    // like subscription cancellation emails
    // TODO: add donation confirmation emails to this flow as well.
    .then(() => {
      if (activity.type === activityType.SUBSCRIPTION_CANCELED) {
        return emailLib.sendMessageFromActivity(activity)
      }
      return Promise.resolve();
    })

    // process notification entries
    .then(() => {
      if (!activity.CollectiveId || !activity.type) {
        return Promise.resolve([]);
      }
      const where = {
        type: [
          activityType.ACTIVITY_ALL,
          activity.type
        ],
        channel: ['gitter', 'slack', 'twitter', 'email'],
        active: true
      };

      if (activity.type === activityType.COLLECTIVE_CREATED) {
        notify(activity);
        return [];
      } else {
        where.CollectiveId = activity.CollectiveId;
      }

      return Sequelize.models.Notification.findAll({
        include: {
          model: Sequelize.models.User,
          attributes: ['id', 'email']
        },
        where
      })
    })
    .then(notifConfigs => {
      return Promise.map(notifConfigs, notifConfig => {
        if (notifConfig.channel === 'gitter') {
          return publishToGitter(activity, notifConfig);
        } else if (notifConfig.channel === 'slack') {
          return publishToSlack(activity, notifConfig.webhookUrl, {});
        } else if (notifConfig.channel === 'twitter') {
          return tweetActivity(Sequelize, activity);
        } else if (notifConfig.channel === 'email') {
          return emailLib.sendMessageFromActivity(activity, notifConfig);
        } else {
          return Promise.resolve();
        }
      })
    })
    .catch(err => {
      console.error(`Error while publishing activity type ${activity.type} for collective ${activity.CollectiveId}`, err);
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
 * Send the notification email to all users that have not unsubscribed
 * @param {*} users: [ { id, email, firstName, lastName }]
 * @param {*} activity [ { type, CollectiveId }]
 */
async function notifySubscribers(users, activity) {
  const unsubscriptions = await models.Notification.findAll({
    where: {
      CollectiveId: activity.CollectiveId,
      type: activity.type,
      active: false
    }
  });
  const unsubscribedUserIds = unsubscriptions.map(n => n.UserId);
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

async function notify(activity) {
  if (activity.type === activityType.COLLECTIVE_CREATED) {
    const collective = await models.Collective.findById(activity.data.collective.id)
    const host = await collective.getHostCollective();
    const admins = await host.getAdmins();
    const adminUsers = await models.User.findAll({
      where: {
        CollectiveId: { $in: admins.map(a => a.id) }
      }
    });
    activity.CollectiveId = host.id;
    notifySubscribers(adminUsers, activity);
  }
}
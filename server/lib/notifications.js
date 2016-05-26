const axios = require('axios');
const config = require('config');

const activitiesLib = require('../lib/activities');
const slackLib = require('./slack');
const activityType = require('../constants/activities');

module.exports = (Sequelize, activity) => {
  // publish everything to our private channel
  return publishToSlackPrivateChannel(activity,
    {
      webhookUrl: config.slack.hookUrl,
      channel: config.slack.privateActivityChannel
    })
    // publish a filtered version to our public channel
    .then(() => publishToSlack(activity,
      {
        webhookUrl: config.slack.hookUrl,
        channel: config.slack.publicActivityChannel
      }))
    // process notification entries
    .then(() => {
      if(!activity.GroupId || !activity.type) {
        return Promise.resolve([]);
      }
      return Sequelize.models.Notification.findAll({
        where: {
          type: [
            activityType.ACTIVITY_ALL,
            activity.type
          ],
          GroupId: activity.GroupId,
          // for now, only handle gitter and slack webhooks in this lib
          // TODO sdubois: move email + internal slack channels to this lib
          channel: ['gitter', 'slack'],
          active: true
        }
      })
    })
    .then(notifConfigs =>
      Promise.all(notifConfigs, notifConfig => {
        if (notifConfig.channel === 'gitter') {
          return publishToGitter(activity, notifConfig);
        } else if (notifConfig.channel === 'slack') {
          return publishToSlack(activity, notifConfig);
        } else {
          return Promise.resolve();
        }
      }))
    .catch(err => {
      console.error(`Error while publishing activity type ${activity.type} for group ${activity.GroupId}`, err);
    });
};

function publishToGitter(activity, notifConfig) {
  const message = activitiesLib.formatMessageForPublicChannel(activity, false);

  if (message) {
    return axios.post(notifConfig.webhookUrl, { message });
  } else {
    Promise.resolve();
  }
}

function publishToSlack(activity, notifConfig) {
  return slackLib.postActivityOnPublicChannel(activity, notifConfig);
}

function publishToSlackPrivateChannel(activity, notifConfig) {
  return slackLib.postActivityOnPrivateChannel(activity, notifConfig);
}
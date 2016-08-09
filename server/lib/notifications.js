const axios = require('axios');
const config = require('config');
const Promise = require('bluebird');

const activitiesLib = require('../lib/activities');
const slackLib = require('./slack');
const twitter = require('./twitter');
const activityType = require('../constants/activities');

module.exports = (Sequelize, activity) => {
  // publish everything to our private channel
  return publishToSlackPrivateChannel(activity)
    // publish a filtered version to our public channel
    .then(() => publishToSlack(activity, config.slack.webhookUrl,
      {
        channel: config.slack.publicActivityChannel
      }))
    // process notification entries
    .then(() => {
      if (!activity.GroupId || !activity.type) {
        return Promise.resolve([]);
      }
      return Sequelize.models.Notification.findAll({
        where: {
          type: [
            activityType.ACTIVITY_ALL,
            activity.type
          ],
          GroupId: activity.GroupId,
          channel: ['gitter', 'slack', 'twitter'],
          active: true
        }
      })
    })
    .then(notifConfigs =>
      Promise.map(notifConfigs, notifConfig => {
        if (notifConfig.channel === 'gitter') {
          return publishToGitter(activity, notifConfig);
        } else if (notifConfig.channel === 'slack') {
          return publishToSlack(activity, notifConfig.webhookUrl, {});
        } else if (notifConfig.channel === 'twitter') {
          return twitter.tweetActivity(Sequelize, activity);
        } else {
          return Promise.resolve();
        }
      }))
    .catch(err => {
      console.error(`Error while publishing activity type ${activity.type} for group ${activity.GroupId}`, err);
    });
};

function publishToGitter(activity, notifConfig) {
  const message = activitiesLib.formatMessageForPublicChannel(activity, 'markdown');
  if (message) {
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

const axios = require('axios');
const activitiesLib = require('../lib/activities');
const slackLib = require('./slack');

const ACTIVITY_ALL = 'all';

module.exports = (Sequelize, activity) => {
  if(!activity.GroupId || !activity.type) {
    return;
  }
  Sequelize.models.Notification.findAll({
    where: {
      type: [
        ACTIVITY_ALL,
        activity.type
      ],
      GroupId: activity.GroupId,
      // for now, only handle gitter and slack webhooks in this lib
      // TODO sdubois: move email + internal slack channels to this lib
      channel: ['gitter', 'slack'],
      active: true
    }
  }).then(notifConfigs => {
    return notifConfigs.map(notifConfig => {
      if (notifConfig.channel === 'gitter') {
        return publishToGitter(activity, notifConfig);
      } else if (notifConfig.channel === 'slack') {
        return publishToSlack(activity, notifConfig);
      }
    })
  })
  .catch(err => {
    console.error(`Error while publishing activity type ${activity.type} for group ${activity.GroupId}`, err);
  });
};

function publishToGitter(activity, notifConfig) {
  return axios
    .post(notifConfig.webhookUrl, {
      message: activitiesLib.formatMessage(activity, false)
    });
}

function publishToSlack(activity, notifConfig) {
  return slackLib.postActivity(activity, {
    webhookUrl: notifConfig.webhookUrl,
    channel: undefined
  });
}

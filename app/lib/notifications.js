const axios = require('axios');
const activitiesLib = require('../lib/activities');

const ACTIVITY_ALL = 'all';

module.exports = (Sequelize, activity) => {
  console.log("Publishing notifications", Sequelize.models.Notification, activity);
  Sequelize.models.Notification.findAll({
    where: {
      type: [
        ACTIVITY_ALL,
        activity.type
      ],
      GroupId: activity.GroupId,
      // for now, only handle gitter webhook in this lib
      // TODO sdubois: move email + slack channels to this lib
      channel: 'gitter'
    }
  }).then(notifications => {
    return notifications.map(notif => {
      if (notif.channel === 'gitter') {
        return publishToGitter(activity, notif);
      }
    })
  })
  .catch(err => {
    console.error('Error while publishing activity type ' + activity.type + ' for group ' + activity.GroupId, err);
  });
};

function publishToGitter(activity, notifConfig) {
  console.log("Publising to gitter", notifConfig.webhookUrl, activitiesLib.formatMessage(activity, false));
  return axios
    .post(notifConfig.webhookUrl, {
      message: activitiesLib.formatMessage(activity, false)
    });
}
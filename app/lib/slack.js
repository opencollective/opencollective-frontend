/*
 * Slack message sending logic
 */

const Slack = require('node-slack');
const config = require('config');
const constants = require('../constants/activities');
const activitiesLib = require('../lib/activities');

module.exports = {

  /*
   * Post a given activity to Slack
   */
  postActivity: function(activity) {
    var message = activitiesLib.formatMessage(activity, true);
    var attachment = formatAttachment(activity);
    this.postMessage(message, attachment);
  },

  /*
   * Posts a message on internal OpenCollective slack
   */
  postMessage: function(msg, attachmentArray, channel){
    const slack = new Slack(config.slack.hookUrl,{});

    return slack.send({
      text: msg,
      channel: channel || config.slack.activityChannel,
      username: 'ActivityBot',
      icon_emoji: ':raising_hand:',
      attachments: attachmentArray || []
    })
    .catch((err)=>{
      console.error(err);
    });
  }
}

function formatAttachment(activity) {
  if (activity.type === constants.WEBHOOK_STRIPE_RECEIVED) {
    return [{
      title: 'Data',
      color: 'good',
      text: activitiesLib.formatAttachment(activity.data)
    }];
  }
  return [];
}
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
  postActivity: function(activity, options) {
    if (!options) {
      options = {};
    }
    var message = activitiesLib.formatMessage(activity, true);
    options.attachments = formatAttachment(activity);
    this.postMessage(message, options);
  },

  /*
   * Posts a message to a slack webhook
   */
  postMessage: function(msg, options) {
    if(!options) {
      options = {};
    }
    var slackOptions = {
      text: msg,
      username: 'OpenCollective Activity Bot',
      icon_url: 'https://opencollective.com/favicon.ico',
      attachments: options.attachments || []
    };

    if (!options.hasOwnProperty('channel')) {
      slackOptions.channel = config.slack.activityChannel;
    } else if (options.channel) {
      slackOptions.channel = options.channel;
    }

    return new Promise((resolve, reject) => {

      return new Slack(options.webhookUrl || config.slack.hookUrl, {})
        .send(slackOptions, (err) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          resolve();
        });
    });
  }
};

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

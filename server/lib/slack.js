/*
 * Slack message sending logic
 */

const Slack = require('node-slack');
const config = require('config');
const activitiesLib = require('../lib/activities');
const constants = require('../constants/activities');

module.exports = {

  /*
   * Post a given activity to a private channel for Open Collective Core Team
   */
  postActivityOnPrivateChannel: function(activity, options) {
    if (!options) {
      options = {};
    }
    var message = activitiesLib.formatMessageForPrivateChannel(activity, true);
    options.attachments = formatAttachment(activity);
    options.channel = config.slack.privateActivityChannel;
    return this.postMessage(message, config.slack.hookUrl, options);
  },

  /*
   * Post a given activity to a public channel for anyone to see the activity
   */
  postActivityOnPublicChannel: function(activity, options) {
    if (!options) {
      options = {};
    }
    var message = activitiesLib.formatMessageForPublicChannel(activity, true);
    options.attachments = [];
    options.channel = config.slack.publicActivityChannel;
    return this.postMessage(message, config.slack.hookUrl, options);
  },

  /*
   * Posts a message to a slack webhook
   */
  postMessage: function(msg, webhookUrl, options) {
    if(!options) {
      options = {};
    }
    var slackOptions = {
      text: msg,
      username: 'OpenCollective Activity Bot',
      icon_url: 'https://opencollective.com/favicon.ico',
      attachments: options.attachments || []
    };

    // note that channel is optional on slack, as every webhook has a default channel
    if (options.channel) {
      slackOptions.channel = options.channel;
    }

    return new Promise((resolve, reject) => {
      if (!slackOptions.text) {
        return resolve();
      }

      return new Slack(webhookUrl, {})
        .send(slackOptions, (err) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          return resolve();
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
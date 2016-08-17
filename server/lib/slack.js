/*
 * Slack message sending logic
 */

const Slack = require('node-slack');
const config = require('config');
const activitiesLib = require('../lib/activities');
const constants = require('../constants/activities');

module.exports = {

  /*
   * Post a given activity to OpenCollective private channel
   * This method can only publish to our webhookUrl and our private channel, so we don't leak info by mistake
   */
  postActivityOnPrivateChannel: function(activity) {
    const message = activitiesLib.formatMessageForPrivateChannel(activity, 'slack');
    const options = {
      attachments: formatAttachment(activity),
      channel: config.slack.privateActivityChannel
    };
    return this.postMessage(message, config.slack.webhookUrl, options);
  },

  /*
   * Post a given activity to a public channel (meaning scrubbed info only)
   */
  postActivityOnPublicChannel: function(activity, webhookUrl, options) {
    if (!options) {
      options = {};
    }
      const message = activitiesLib.formatMessageForPublicChannel(activity, 'slack');
      return this.postMessage(message, webhookUrl, options);
  },

  /*
   * Posts a message to a slack webhook
   */
  postMessage: function(msg, webhookUrl, options) {
    if (!options) {
      options = {};
    }
    const slackOptions = {
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
      // production check
      if (process.env.NODE_ENV !== 'production') {
        return resolve();
      }

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

const formatAttachment = (activity) => {
  if (activity.type === constants.WEBHOOK_STRIPE_RECEIVED) {
    return [{
      title: 'Data',
      color: 'good',
      text: activitiesLib.formatAttachment(activity.data)
    }];
  }
  return [];
}
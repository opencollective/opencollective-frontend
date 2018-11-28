/*
 * Slack message sending logic
 */

import Slack from 'node-slack';
import config from 'config';
import debug from 'debug';
import activitiesLib from '../lib/activities';
import constants from '../constants/activities';

const debugSlack = debug('slack');

export default {
  /*
   * Post a given activity to OpenCollective private channel
   * This method can only publish to our webhookUrl and our private channel, so we don't leak info by mistake
   */
  postActivityOnPrivateChannel(activity) {
    const message = activitiesLib.formatMessageForPrivateChannel(activity, 'slack');
    const options = {
      attachments: formatAttachment(activity),
      channel: config.slack.privateActivityChannel,
    };
    return this.postMessage(message, config.slack.webhookUrl, options);
  },

  /*
   * Post a given activity to a public channel (meaning scrubbed info only)
   */
  postActivityOnPublicChannel(activity, webhookUrl, options) {
    if (!options) {
      options = {};
    }
    const message = activitiesLib.formatMessageForPublicChannel(activity, 'slack');
    return this.postMessage(message, webhookUrl, options);
  },

  /*
   * Posts a message to a slack webhook
   */
  postMessage(msg, webhookUrl, options) {
    if (!options) {
      options = {};
    }

    if (options.linkTwitterMentions) {
      msg = msg.replace(/@([a-z\d_]+)/gi, '<http://twitter.com/$1|@$1>');
    }

    const slackOptions = {
      text: msg,
      username: 'OpenCollective Activity Bot',
      icon_url: 'https://opencollective.com/favicon.ico',
      attachments: options.attachments || [],
    };

    // note that channel is optional on slack, as every webhook has a default channel
    if (options.channel) {
      slackOptions.channel = options.channel;
    }

    return new Promise((resolve, reject) => {
      // production check
      if (process.env.NODE_ENV !== 'production' && !process.env.TEST_SLACK) {
        return resolve();
      }

      if (!slackOptions.text) {
        return resolve();
      }

      return new Slack(webhookUrl, {}).send(slackOptions, err => {
        if (err) {
          debugSlack(err);
          return reject(err);
        }
        return resolve();
      });
    });
  },
};

const formatAttachment = activity => {
  if (activity.type === constants.WEBHOOK_STRIPE_RECEIVED) {
    return [
      {
        title: 'Data',
        color: 'good',
        text: activitiesLib.formatAttachment(activity.data),
      },
    ];
  }
  return [];
};

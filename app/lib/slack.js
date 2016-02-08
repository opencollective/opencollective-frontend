/*
 * Slack message sending logic
 */

const Slack = require('node-slack');
const config = require('config');
const activities = require('../constants/activities');

const linkifyForSlack = require('../lib/utils').linkifyForSlack;

module.exports = {

	formatActivity: function(activity) {

    var returnVal = '';

    // declare common variables used across multiple activity types
    var userString = '';
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var currency = '';
    var tags = [];
    var description = '';
    var linkifyTwitter = '';
    var linkifyWebsite = '';

    // get user data
    if (activity.data.user) {
      const userName = activity.data.user.username;
      const userEmail = activity.data.user.email;
      userString = userName ? userName + ' (' + userEmail + ')' : userEmail;

      const twitterHandle = activity.data.user.twitterHandle;
      linkifyTwitter = linkifyForSlack('http://www.twitter.com/'+twitterHandle, '@'+twitterHandle);
      linkifyWebsite = linkifyForSlack(activity.data.user.websiteUrl, null);
    }

    // get group data
    if (activity.data.group) {
      groupName = activity.data.group.name;
      publicUrl = activity.data.group.publicUrl;
    }

    // get transaction data
    if (activity.data.transaction) {
        amount = activity.data.transaction.amount;
        currency = activity.data.transaction.currency;
        tags = activity.data.transaction.tags;
        description = activity.data.transaction.description;
    }


    switch (activity.type) {

      // Currently used for both new donation and expense
      case activities.GROUP_TRANSANCTION_CREATED:

        if (activity.data.transaction.isDonation) {
          // Ex: Aseem gave 1 USD/month to WWCode-Seattle
          returnVal += `Woohoo! ${userString} gave ${currency} ${amount}/month to ${linkifyForSlack(publicUrl, groupName)}!`;

        } else if (activity.data.transaction.isExpense) {
          // Ex: Aseem submitted a Foods & Beverage expense to WWCode-Seattle: USD 12.57 for 'pizza'
          returnVal += `Hurray! ${userString} submitted a ${tags[0]} expense to ${linkifyForSlack(publicUrl, groupName)}: ${currency} ${amount} for ${description}!`
        }
        break;

      case activities.GROUP_TRANSANCTION_PAID:
        // Ex: Jon approved a transaction for WWCode-Seattle: USD 12.57 for 'pizza';
        returnVal += `Expense approved on ${linkifyForSlack(publicUrl, groupName)}: ${currency} ${amount} for '${description}'`;
        break;

      case activities.USER_CREATED:
        // Ex: New user joined: Alice Walker (alice@walker.com) | @alicewalker | websiteUrl
        returnVal += `New user joined: ${userString} | ${linkifyTwitter} | ${linkifyWebsite}`;
        break;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        returnVal += `New webhook.stripe.received`;
        break;

      default:
        returnVal += `Oops... I got an unknown activity type: ${activity.type}`;
    }
    return returnVal;
  },

  /*
   * Posts a message on slack
   */

  postMessage: function(msg, channel){
    const slack = new Slack(config.slack.hookUrl,{});

    channel = channel !== undefined ? chanenl : '#activity';

    slack.send({
      text: msg,
      channel: channel,
      username: 'ActivityBot',
      icon_emoji: ':raising_hand:'
    });
  },

  postActivity: function(activity) {
    postMessage(formatActivity(activity));
  }
}
/*
 * Slack message sending logic
 */

const Slack = require('node-slack');
const config = require('config');
const activities = require('../constants/activities');

module.exports = {

  /*
   * Post a given activity to Slack
   */

  postActivity: function(activity) {
    this.postMessage(this.formatActivity(activity));
  },

  /*
   * Formats an activity based on the type to show in Slack
   */

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
      linkifyTwitter = this.linkifyForSlack('http://www.twitter.com/'+twitterHandle, '@'+twitterHandle);
      linkifyWebsite = this.linkifyForSlack(activity.data.user.websiteUrl, null);
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
        tags = JSON.stringify(activity.data.transaction.tags);
        description = activity.data.transaction.description;
    }


    switch (activity.type) {

      // Currently used for both new donation and expense
      case activities.GROUP_TRANSANCTION_CREATED:

        if (activity.data.transaction.isDonation) {
          // Ex: Aseem gave 1 USD/month to WWCode-Seattle
          returnVal += `Woohoo! ${userString} gave ${currency} ${amount}/month to ${this.linkifyForSlack(publicUrl, groupName)}!`;

        } else if (activity.data.transaction.isExpense) {
          // Ex: Aseem submitted a Foods & Beverage expense to WWCode-Seattle: USD 12.57 for 'pizza'
          returnVal += `Hurray! ${userString} submitted a ${tags} expense to ${this.linkifyForSlack(publicUrl, groupName)}: ${currency} ${amount} for ${description}!`
        }
        break;

      case activities.GROUP_TRANSANCTION_PAID:
        // Ex: Jon approved a transaction for WWCode-Seattle: USD 12.57 for 'pizza';
        returnVal += `Expense approved on ${this.linkifyForSlack(publicUrl, groupName)}: ${currency} ${amount} for '${description}'`;
        break;

      case activities.USER_CREATED:
        // Ex: New user joined: Alice Walker (alice@walker.com) | @alicewalker | websiteUrl
        returnVal += `New user joined: ${userString} | ${linkifyTwitter} | ${linkifyWebsite}`;
        break;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        // Ex: WWCode-Seattle received 1 USD/month from Aseem
        returnVal += `Yay! ${this.linkifyForSlack(publicUrl, groupName)} received ${currency} ${amount}/month from ${userString}!`;
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

    return slack.send({
      text: msg,
      channel: channel || config.slack.activityChannel,
      username: 'ActivityBot',
      icon_emoji: ':raising_hand:'
    })
    .catch((err)=>{
      console.error(err);
    });
  },

  /**
   * Generates a url for Slack
   */
  linkifyForSlack: function(link, text){
    if (link && !text) {
      text = link;
    } else if (!link && text) {
      return text;
    } else if (!link && !text){
      return '';
    }
    return `<${link}|${text}>`;
  }
}
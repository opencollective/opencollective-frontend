var activities = require('../constants/activities');
var flatten = require('flat');

module.exports = {

  /*
   * Formats an activity based on its type
   */
  formatMessage: (activity, linkify) => {

    // declare common variables used across multiple activity types
    var userString = '';
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var interval = '';
    var recurringAmount = null;
    var currency = '';
    var tags = [];
    var description = '';
    var twitter = ''
    var website = '';
    var eventType = '';

    // get user data
    if (activity.data.user) {
      const userName = activity.data.user.username;
      const userEmail = activity.data.user.email;
      userString = userName ? `${userName} (${userEmail})` : userEmail;

      const twitterHandle = activity.data.user.twitterHandle;
      if (linkify) {
        twitter = linkifyForSlack(`http://www.twitter.com/${twitterHandle}`, `@${twitterHandle}`);
        website = linkifyForSlack(activity.data.user.websiteUrl, null);
      } else {
        twitter = `@${twitterHandle}`;
        website = activity.data.user.websiteUrl;
      }
    }

    // get group data
    if (activity.data.group) {
      groupName = activity.data.group.name;
      publicUrl = activity.data.group.publicUrl;
    }

    // get donation data
    if (activity.data.donation) {
      amount = activity.data.donation.amount/100;
      currency = activity.data.donation.currency;
    }

    // get subscription data
    if (activity.data.subscription) {
      interval = activity.data.subscription.interval;
      recurringAmount = amount + (interval ? `/${interval}` : '');
    }

    // get transaction data
    if (activity.data.transaction) {
      amount = activity.data.transaction.amount;
      interval = activity.data.transaction.interval;
      recurringAmount = amount + (interval ? `/${interval}` : '');
      currency = activity.data.transaction.currency;
      tags = JSON.stringify(activity.data.transaction.tags);
      description = activity.data.transaction.description;
    }

    // get event data
    if (activity.data.event) {
      eventType = activity.data.event.type;
    }

    var group;
    if (linkify) {
      group = linkifyForSlack(publicUrl, groupName);
    } else {
      group = groupName;
    }

    switch (activity.type) {

      // Currently used for both new donation and expense
      case activities.GROUP_TRANSACTION_CREATED:

        if (activity.data.transaction.isDonation) {
          // Ex: Aseem gave 1 USD/month to WWCode-Seattle
          return `New Donation: ${userString} gave ${currency} ${amount} to ${group}!`;
        } else if (activity.data.transaction.isExpense) {
          // Ex: Aseem submitted a Foods & Beverage expense to WWCode-Seattle: USD 12.57 for 'pizza'
          return `New Expense: ${userString} submitted a ${tags} expense to ${group}: ${currency} ${amount} for ${description}!`
        } else {
          return `Hmm found a group.transaction.created that's neither donation or expense. Activity id: ${activity.id}`;
        }
        break;

      case activities.GROUP_TRANSACTION_PAID:
        // Ex: Jon approved a transaction for WWCode-Seattle: USD 12.57 for 'pizza';
        return `Expense approved on ${group}: ${currency} ${amount} for '${description}'`;
        break;

      case activities.USER_CREATED:
        // Ex: New user joined: Alice Walker (alice@walker.com) | @alicewalker | websiteUrl
        return `New user joined: ${userString} | ${twitter} | ${website}`;
        break;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        return `Stripe event received: ${eventType}`;
        break;

      case activities.SUBSCRIPTION_CONFIRMED:
        // Ex: Confirmed subscription of 1 USD/month from Aseem to WWCode-Seattle!
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${group}!`;
      break;

      default:
        return `Oops... I got an unknown activity type: ${activity.type}`;
    }
  },

  formatAttachment: attachment => {
    const flattenedData = flatten(attachment);
    const rows = Object.keys(flattenedData)
      .filter(key => flattenedData[key])
      .map(key => `${key}: ${flattenedData[key]}`);
    return rows.join('\n');
  }
}

/**
 * Generates a url for Slack
 */
function linkifyForSlack(link, text) {
  if (link && !text) {
    text = link;
  } else if (!link && text) {
    return text;
  } else if (!link && !text){
    return '';
  }
  return `<${link}|${text}>`;
}

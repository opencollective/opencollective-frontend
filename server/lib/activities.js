const activities = require('../constants/activities');
const flatten = require('flat');

module.exports = {

  /*
   * Formats an activity *FOR INTERNAL USE* based on its type
   */
  formatMessageForPrivateChannel: (activity, linkify) => {

    var userString = '';
    var userId;
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var interval = '';
    var recurringAmount = null;
    var currency = '';
    var tags = [];
    var description = '';
    var eventType = '';

    // get user data
    if (activity.data.user) {
      userString = getUserString(activity.data.user, linkify, true);
      userId = activity.data.user.id;
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
          return `New Donation: ${userString} gave ${currency} ${amount} to ${group}!`;
        } else if (activity.data.transaction.isExpense) {
          return `New Expense: ${userString} submitted a ${tags} expense to ${group}: ${currency} ${amount} for ${description}!`
        } else {
          return `Hmm found a group.transaction.created that's neither donation or expense. Activity id: ${activity.id}`;
        }
        break;

      case activities.GROUP_TRANSACTION_PAID:
        return `Expense approved on ${group}: ${currency} ${amount} for '${description}'`;
        break;

      case activities.USER_CREATED:
        return `New user joined: ${userString}`;
        break;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        return `Stripe event received: ${eventType}`;
        break;

      case activities.SUBSCRIPTION_CONFIRMED:
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${group}!`;
        break;

      case activities.GROUP_CREATED:
        return `New group created: ${group} by ${userString}`;
        break;

      case activities.GROUP_USER_ADDED:
        return `New user: ${userString} (UserId: ${userId}) added to group: ${group}`;
        break;

      default:
        return `New event: ${activity.type}`;
    }
  },

  /*
   * Formats an activity *FOR EXTERNAL USE* based on its type
   * This function strips out email addresses and shows only a subset of activities
   * because many of them aren't relevant externally (like USER_CREATED)
   */
  formatMessageForPublicChannel: (activity, linkify) => {

    var userString = '';
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var interval = '';
    var recurringAmount = null;
    var currency = '';
    var tags = [];
    var description = '';

    // get user data
    if (activity.data.user) {
      userString = getUserString(activity.data.user, linkify);
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
          return `New Donation: ${userString} gave ${currency} ${amount} to ${group}!`;
        } else if (activity.data.transaction.isExpense) {
          return `New Expense: ${userString} submitted a ${tags} expense to ${group}: ${currency} ${amount} for ${description}!`
        }
        break;

      case activities.GROUP_TRANSACTION_PAID:
        return `Expense approved on ${group}: ${currency} ${amount} for '${description}'`;
        break;

      case activities.SUBSCRIPTION_CONFIRMED:
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${group}!`;
        break;

      case activities.GROUP_CREATED:
        return `New group created: ${group} by ${userString}`;
        break;

      default:
        return '';
    }
  },

  formatAttachment: (attachment) => {
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
const linkifyForSlack = (link, text) => {
  if (link && !text) {
    text = link;
  } else if (!link && text) {
    return text;
  } else if (!link && !text){
    return '';
  }
  return `<${link}|${text}>`;
}

/**
 * Generates a userString given a user's info
 */
const getUserString = (user, linkify, includeEmail) => {
  const userString = user.name || user.twitterHandle || 'someone';
  const link = user.twitterHandle ? `http://www.twitter.com/${user.twitterHandle}` : user.website;

  var returnVal;
  if (linkify && link) {
    returnVal = linkifyForSlack(link, userString);
  } else {
    returnVal = userString;
  }

  if (includeEmail && user.email) {
    returnVal += ` (${user.email})`;
  }
  return returnVal;
}

const activities = require('../constants/activities');
const flatten = require('flat');
const currencies = require('../constants/currencies');

module.exports = {

  /*
   * Formats an activity *FOR INTERNAL USE* based on its type
   */
  formatMessageForPrivateChannel: (activity, format) => {

    var userString = '';
    var userId;
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var interval = '';
    var recurringAmount = null;
    var currency = '';
    var description = '';
    var eventType = '';
    var provider = '';
    var connectedAccountUsername = '';
    var title = '';
    const connectedAccountLink = '';
    var lastEditedById = 0;


    // get user data
    if (activity.data.user) {
      userString = getUserString(format, activity.data.user, true);
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
      description = activity.data.transaction.description;
    }

    // get expense data
    if (activity.data.expense) {
      amount = activity.data.expense.amount/100;
      currency = activity.data.expense.currency;
      title = activity.data.expense.title;
      lastEditedById = activity.data.expense.lastEditedById;
    }

    // get connected account data
    if (activity.data.connectedAccount) {
      provider = activity.data.connectedAccount.provider;
      connectedAccountUsername = activity.data.connectedAccount.username;
      if (provider === 'github') {
        connectedAccountUsernameLink = linkify(format, `https://github.com/${connectedAccountUsername}`, null);
      }
    }

    // get event data
    if (activity.data.event) {
      eventType = activity.data.event.type;
    }

    const group = linkify(format, publicUrl, groupName);

    switch (activity.type) {

      // Currently used for both new donation and expense
      case activities.GROUP_TRANSACTION_CREATED:
        if (activity.data.transaction.isDonation) {
          return `New Donation: ${userString} gave ${currency} ${amount} to ${group}!`;
        }
        break;

      case activities.GROUP_EXPENSE_CREATED:
        return `New Expense: ${userString} submitted an expense to ${group}: ${currency} ${amount} for ${title}!`

      case activities.GROUP_EXPENSE_REJECTED:
        return `Expense rejected: ${currency} ${amount} for ${title} in ${group} by userId: ${lastEditedById}!`

      case activities.GROUP_EXPENSE_APPROVED:
        return `Expense approved: ${currency} ${amount} for ${title} in ${group} by userId: ${lastEditedById}!`

      case activities.CONNECTED_ACCOUNT_CREATED:
        return `New Connected Account created by ${connectedAccountUsername} on ${provider}. ${connectedAccountLink}`;

      case activities.GROUP_TRANSACTION_PAID:
        const details = activity.data.preapprovalDetails;
        var remainingClause = '';
        if (details && details.maxTotalAmountOfAllPayments && details.curPaymentsAmount) {
          const remaining = Number(details.maxTotalAmountOfAllPayments) - Number(details.curPaymentsAmount);
          remainingClause = `(${remaining} ${currency} remaining on preapproval key)`;
        } else {
          remainingClause = `[Manual payment]`;
        }
        return `Expense paid on ${group}: ${currency} ${amount} for '${description}' ${remainingClause}`;

      case activities.USER_CREATED:
        return `New user joined: ${userString}`;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        return `Stripe event received: ${eventType}`;

      case activities.SUBSCRIPTION_CONFIRMED:
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${group}!`;

      case activities.SUBSCRIPTION_CANCELED:
        const subscriptionId = activity.data.subscriptionId;
        return `Subscription ${subscriptionId} canceled`;

      case activities.GROUP_CREATED:
        return `New group created: ${group} by ${userString}`;

      case activities.GROUP_USER_ADDED:
        return `New user: ${userString} (UserId: ${userId}) added to group: ${group}`;

      default:
        return `New event: ${activity.type}`;
    }
  },

  /*
   * Formats an activity *FOR EXTERNAL USE* based on its type
   * This function strips out email addresses and shows only a subset of activities
   * because many of them aren't relevant externally (like USER_CREATED)
   */
  formatMessageForPublicChannel: (activity, format) => {

    var userString = '';
    var groupName = '';
    var publicUrl = '';
    var amount = null;
    var interval = '';
    var recurringAmount = null;
    var currency = '';
    var tags = [];
    var description = '';
    var userTwitter = '';
    var groupTwitter = '';
    var tweet = '';
    var title = '';

    // get user data
    if (activity.data.user) {
      userString = getUserString(format, activity.data.user);
      userTwitter = activity.data.user.twitterHandle;
    }

    // get group data
    if (activity.data.group) {
      groupName = activity.data.group.name;
      publicUrl = activity.data.group.publicUrl;
      groupTwitter = activity.data.group.twitterHandle;
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

    var tweetLink, tweetThis = '';

    // get expense data
    if (activity.data.expense) {
      amount = activity.data.expense.amount/100;
      currency = activity.data.expense.currency;
      title = activity.data.expense.title;
    }

    var group;
    if (linkify) {
      group = linkify(format, publicUrl, groupName);
    } else {
      group = groupName;
    }
    switch (activity.type) {

      // Currently used for both new donation and expense
      case activities.GROUP_TRANSACTION_CREATED:

        if (activity.data.transaction.isDonation) {
          if (userTwitter) {
            tweet = encodeURIComponent(`@${userTwitter} thanks for your ${currencies[currency](recurringAmount)} donation to ${groupTwitter ? `@${groupTwitter}` : groupName} 👍 ${publicUrl}`);
            tweetLink = linkify(format, `https://twitter.com/intent/tweet?status=${tweet}`,"Thank that person on Twitter");
            tweetThis = ` [${tweetLink}]`;
          }
          return `New Donation: ${userString} gave ${currency} ${amount} to ${group}!${tweetThis}`;
        } else if (activity.data.transaction.isExpense) {
          return `New Expense: ${userString} submitted a ${tags} expense to ${group}: ${currency} ${amount} for ${description}!`
        }
        break;

      case activities.GROUP_EXPENSE_CREATED:
        return `New Expense: ${userString} submitted an expense to ${group}: ${currency} ${amount} for ${title}!`

      case activities.GROUP_EXPENSE_REJECTED:
        return `Expense rejected: ${currency} ${amount} for ${title} in ${group}!`

      case activities.GROUP_EXPENSE_APPROVED:
        return `Expense approved: ${currency} ${amount} for ${title} in ${group}!`

      case activities.GROUP_TRANSACTION_PAID:
        return `Expense paid on ${group}: ${currency} ${amount} for '${description}'`;

      case activities.SUBSCRIPTION_CONFIRMED:
        if (userTwitter) {
          tweet = encodeURIComponent(`@${userTwitter} thanks for your ${currencies[currency](recurringAmount)} donation to ${groupTwitter ? `@${groupTwitter}` : groupName} 👍 ${publicUrl}`);
          tweetLink = linkify(format, `https://twitter.com/intent/tweet?status=${tweet}`,"Thank that person on Twitter");
          tweetThis = ` [${tweetLink}]`;
        }
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${group}!${tweetThis}`;

      case activities.GROUP_CREATED:
        return `New group created: ${group} by ${userString}`;

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
const linkify = (format, link, text) => {
  switch (format) {
    case 'slack':
      if (link && !text) {
        text = link;
      } else if (!link && text) {
        return text;
      } else if (!link && !text){
        return '';
      }
      return `<${link}|${text}>`;

    case 'markdown':
    default:
      return `[${text}](${link})`;
  }
}

/**
 * Generates a userString given a user's info
 */
const getUserString = (format, user, includeEmail) => {
  const userString = user.name || user.twitterHandle || 'someone';
  const link = user.twitterHandle ? `https://twitter.com/${user.twitterHandle}` : user.website;

  var returnVal;
  if (link) {
    returnVal = linkify(format, link, userString);
  } else {
    returnVal = userString;
  }

  if (includeEmail && user.email) {
    returnVal += ` (${user.email})`;
  }
  return returnVal;
}

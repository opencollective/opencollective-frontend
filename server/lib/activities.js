import activities from '../constants/activities';
import flatten from 'flat';
import { formatCurrency } from './currency';
import { TransactionTypes } from '../constants/transactions';

export default {
  /*
   * Formats an activity *FOR INTERNAL USE* based on its type
   */
  formatMessageForPrivateChannel: (activity, format) => {
    let userString = '',
      hostString = '';
    let userId;
    let collectiveName = '';
    let publicUrl = '';
    let amount = null;
    let interval = '';
    let recurringAmount = null;
    let currency = '';
    let description = '';
    let eventType = '';
    let service = '';
    let connectedAccountUsername = '';
    let connectedAccountLink = '';
    let lastEditedById = 0;

    // get user data
    if (activity.data.user) {
      userString = getUserString(format, activity.data.fromCollective, activity.data.user.email);
    }

    if (activity.data.user) {
      userId = activity.data.user.id;
    }

    // get collective data
    if (activity.data.collective) {
      collectiveName = activity.data.collective.name;
      ({ publicUrl } = activity.data.collective);
    }

    // get host data
    if (activity.data.host) {
      hostString = `on ${getUserString(format, activity.data.host, activity.data.host.email)}`;
    }

    // get donation data
    if (activity.data.order) {
      amount = activity.data.order.totalAmount / 100;
      ({ currency } = activity.data.order);
    }

    // get subscription data
    if (activity.data.subscription) {
      ({ interval } = activity.data.subscription);
      amount = amount || activity.data.subscription.amount / 100;
      recurringAmount = amount + (interval ? `/${interval}` : '');
    }

    // get transaction data
    if (activity.data.transaction) {
      amount = activity.data.transaction.amount / 100;
      recurringAmount = amount + (interval ? `/${interval}` : '');
      ({ currency } = activity.data.transaction);
      ({ description } = activity.data.transaction);
    }

    // get expense data
    if (activity.data.expense) {
      amount = activity.data.expense.amount / 100;
      ({ currency } = activity.data.expense);
      ({ description } = activity.data.expense);
      ({ lastEditedById } = activity.data.expense);
    }

    // get connected account data
    if (activity.data.connectedAccount) {
      ({ service } = activity.data.connectedAccount);
      connectedAccountUsername = activity.data.connectedAccount.username;
      if (service === 'github') {
        connectedAccountLink = linkify(format, `https://github.com/${connectedAccountUsername}`, null);
      }
    }

    // get event data
    if (activity.data.event) {
      eventType = activity.data.event.type;
    }

    const collective = linkify(format, publicUrl, collectiveName);

    switch (activity.type) {
      // Currently used for both new donation and expense
      case activities.COLLECTIVE_TRANSACTION_CREATED:
        if (activity.data.transaction.type === TransactionTypes.CREDIT) {
          return `New Donation: ${userString} gave ${currency} ${amount} to ${collective}!`;
        }
        break;

      case activities.COLLECTIVE_EXPENSE_CREATED:
        return `New Expense: ${userString} submitted an expense to ${collective}: ${currency} ${amount} for ${description}!`;

      case activities.COLLECTIVE_EXPENSE_REJECTED:
        return `Expense rejected: ${currency} ${amount} for ${description} in ${collective} by userId: ${lastEditedById}!`;

      case activities.COLLECTIVE_EXPENSE_APPROVED:
        return `Expense approved: ${currency} ${amount} for ${description} in ${collective} by userId: ${lastEditedById}!`;

      case activities.CONNECTED_ACCOUNT_CREATED:
        return `New Connected Account created by ${connectedAccountUsername} on ${service}. ${connectedAccountLink}`;

      case activities.COLLECTIVE_EXPENSE_PAID: {
        const details = activity.data.preapprovalDetails;
        let remainingClause = '';
        if (details && details.maxTotalAmountOfAllPayments && details.curPaymentsAmount) {
          const remaining = Number(details.maxTotalAmountOfAllPayments) - Number(details.curPaymentsAmount);
          remainingClause = `(${remaining} ${currency} remaining on preapproval key)`;
        } else {
          remainingClause = '[Manual payment]';
        }
        return `Expense paid on ${collective}: ${currency} ${amount} for '${description}' ${remainingClause}`;
      }

      case activities.USER_CREATED:
        return `New user joined: ${userString}`;

      case activities.WEBHOOK_STRIPE_RECEIVED:
        return `Stripe event received: ${eventType}`;

      case activities.SUBSCRIPTION_CONFIRMED:
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${collective}!`;

      case activities.SUBSCRIPTION_CANCELED:
        return `Subscription ${activity.data.subscription.id} canceled: ${currency} ${recurringAmount} from ${userString} to ${collective}`;

      case activities.COLLECTIVE_CREATED:
        return `New collective created by ${userString}: ${collective} ${hostString}`.trim();

      case activities.COLLECTIVE_USER_ADDED:
        return `New user: ${userString} (UserId: ${userId}) added to collective: ${collective}`;

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
    let userString = '',
      hostString = '';
    let collectiveName = '';
    let publicUrl = '';
    let amount = null;
    let interval = '';
    let recurringAmount = null;
    let currency = '';
    let description = '';
    let userTwitter = '';
    let collectiveTwitter = '';
    let tweet = '';

    // get user data
    if (activity.data.user) {
      userString = getUserString(format, activity.data.fromCollective);
      if (activity.data.fromCollective) {
        userTwitter = activity.data.fromCollective.twitterHandle;
      }
    }

    // get collective data
    if (activity.data.collective) {
      collectiveName = activity.data.collective.name;
      ({ publicUrl } = activity.data.collective);
      collectiveTwitter = activity.data.collective.twitterHandle;
    }

    // get host data
    if (activity.data.host) {
      hostString = `on ${getUserString(format, activity.data.host)}`;
    }

    // get donation data
    if (activity.data.order) {
      amount = activity.data.order.totalAmount / 100;
      ({ currency } = activity.data.order);
    }

    // get subscription data
    if (activity.data.subscription) {
      ({ interval } = activity.data.subscription);
      amount = amount || activity.data.subscription.amount / 100;
      recurringAmount = amount + (interval ? `/${interval}` : '');
    }

    // get transaction data
    if (activity.data.transaction) {
      amount = activity.data.transaction.amount / 100;
      recurringAmount = amount + (interval ? `/${interval}` : '');
      ({ currency } = activity.data.transaction);
      ({ description } = activity.data.transaction);
    }

    let tweetLink,
      tweetThis = '';

    // get expense data
    if (activity.data.expense) {
      amount = activity.data.expense.amount / 100;
      ({ currency } = activity.data.expense);
      ({ description } = activity.data.expense);
    }

    let collective;
    if (linkify) {
      collective = linkify(format, publicUrl, collectiveName);
    } else {
      collective = collectiveName;
    }

    switch (activity.type) {
      // Currently used for both new donation and expense
      case activities.COLLECTIVE_TRANSACTION_CREATED:
        switch (activity.data.transaction.type) {
          case TransactionTypes.CREDIT:
            if (userTwitter) {
              tweet = encodeURIComponent(
                `@${userTwitter} thanks for your ${formatCurrency(currency, recurringAmount)} contribution to ${
                  collectiveTwitter ? `@${collectiveTwitter}` : collectiveName
                } 👍 ${publicUrl}`,
              );
              tweetLink = linkify(
                format,
                `https://twitter.com/intent/tweet?status=${tweet}`,
                'Thank that person on Twitter',
              );
              tweetThis = ` [${tweetLink}]`;
            }
            return `New Donation: ${userString} gave ${currency} ${amount} to ${collective}!${tweetThis}`;

          case TransactionTypes.DEBIT:
            return `New Expense: ${userString} submitted an expense to ${collective}: ${currency} ${amount} for ${description}!`;
        }

        break;

      case activities.COLLECTIVE_EXPENSE_CREATED:
        return `New Expense: ${userString} submitted an expense to ${collective}: ${currency} ${amount} for ${description}!`;

      case activities.COLLECTIVE_EXPENSE_REJECTED:
        return `Expense rejected: ${currency} ${amount} for ${description} in ${collective}!`;

      case activities.COLLECTIVE_EXPENSE_APPROVED:
        return `Expense approved: ${currency} ${amount} for ${description} in ${collective}!`;

      case activities.COLLECTIVE_EXPENSE_PAID:
        return `Expense paid on ${collective}: ${currency} ${amount} for '${description}'`;

      case activities.SUBSCRIPTION_CONFIRMED:
        if (userTwitter) {
          tweet = encodeURIComponent(
            `@${userTwitter} thanks for your ${formatCurrency(currency, recurringAmount)} contribution to ${
              collectiveTwitter ? `@${collectiveTwitter}` : collectiveName
            } 👍 ${publicUrl}`,
          );
          tweetLink = linkify(
            format,
            `https://twitter.com/intent/tweet?status=${tweet}`,
            'Thank that person on Twitter',
          );
          tweetThis = ` [${tweetLink}]`;
        }
        return `New subscription confirmed: ${currency} ${recurringAmount} from ${userString} to ${collective}!${tweetThis}`;

      case activities.COLLECTIVE_CREATED:
        return `New collective created by ${userString}: ${collective} ${hostString}`.trim();

      case activities.ORDERS_SUSPICIOUS:
        return `Suspicious Order: ${userString} gave ${currency} ${amount} to ${collective}. Score: ${activity.data.recaptchaResponse.score}`;

      default:
        return '';
    }
  },

  formatAttachment: attachment => {
    const flattenedData = flatten(attachment);
    const rows = Object.keys(flattenedData)
      .filter(key => flattenedData[key])
      .map(key => `${key}: ${flattenedData[key]}`);
    return rows.join('\n');
  },
};

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
      } else if (!link && !text) {
        return '';
      }
      return `<${link}|${text}>`;

    case 'markdown':
    default:
      return `[${text}](${link})`;
  }
};

/**
 * Generates a userString given a user's info
 */
const getUserString = (format, userCollective, email) => {
  userCollective = userCollective || {};
  const userString = userCollective.name || userCollective.twitterHandle || 'someone';
  const link = userCollective.twitterHandle
    ? `https://twitter.com/${userCollective.twitterHandle}`
    : userCollective.website;

  let returnVal;
  if (link) {
    returnVal = linkify(format, link, userString);
  } else {
    returnVal = userString;
  }

  if (email) {
    returnVal += ` (${email})`;
  }
  return returnVal;
};

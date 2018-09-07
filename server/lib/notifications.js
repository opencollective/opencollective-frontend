import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';

import { get, set, template } from 'lodash';
import activitiesLib from '../lib/activities';
import slackLib from './slack';
import twitter from './twitter';
import emailLib from '../lib/email';
import activityType from '../constants/activities';
import {W9_BOT_SLUG} from '../constants/collectives';
import models from '../models';
import debugLib from 'debug';
import { formatCurrency } from './utils';
const debug = debugLib("notification");

export default async (Sequelize, activity) => {
  // publish everything to our private channel
  publishToSlackPrivateChannel(activity).catch(console.log);

  // publish a filtered version to our public channel
  publishToSlack(activity, config.slack.webhookUrl, { channel: config.slack.publicActivityChannel })
    .catch(console.log);

  notifyByEmail(activity).catch(console.log);

  // process notification entries for slack, twitter, gitter
  if (!activity.CollectiveId || !activity.type) {
    return;
  }
  const where = {
    CollectiveId: activity.CollectiveId,
    type: [
      activityType.ACTIVITY_ALL,
      activity.type
    ],
    channel: ['gitter', 'slack', 'twitter'],
    active: true
  };

  const notificationChannels = await models.Notification.findAll({ where })

  return Promise.map(notificationChannels, notifConfig => {
    if (notifConfig.channel === 'gitter') {
      return publishToGitter(activity, notifConfig);
    } else if (notifConfig.channel === 'slack') {
      return publishToSlack(activity, notifConfig.webhookUrl, {});
    } else if (notifConfig.channel === 'twitter') {
      return twitter.tweetActivity(activity);
    } else {
      return Promise.resolve();
    }
  })
  .catch(err => {
    console.error(`Error while publishing activity type ${activity.type} for collective ${activity.CollectiveId}`, activity, "error: ", err);
  });
};

function publishToGitter(activity, notifConfig) {
  const message = activitiesLib.formatMessageForPublicChannel(activity, 'markdown');
  if (message && process.env.NODE_ENV === 'production') {
    return axios.post(notifConfig.webhookUrl, { message });
  } else {
    Promise.resolve();
  }
}

function publishToSlack(activity, webhookUrl, options) {
  return slackLib.postActivityOnPublicChannel(activity, webhookUrl, options);
}

function publishToSlackPrivateChannel(activity) {
  return slackLib.postActivityOnPrivateChannel(activity);
}

/**
 * Send the notification email (using emailLib.sendMessageFromActivity)
 * to all users that have not unsubscribed
 * @param {*} users: [ { id, email, firstName, lastName }]
 * @param {*} activity [ { type, CollectiveId }]
 */
async function notifySubscribers(users, activity, options={}) {
  const { data } = activity;
  if (!users || users.length === 0) {
    debug("notifySubscribers: no user to notify for activity", activity.type);
    return;
  }
  debug("notifySubscribers", users.length, users.map(u => u && u.email, activity.type));
  const unsubscribedUserIds = await models.Notification.getUnsubscribersUserIds(get(options, 'template', activity.type), get(options, 'collective.id', activity.CollectiveId));
  debug("unsubscribedUserIds", unsubscribedUserIds);
  if (process.env.ONLY) {
    debug("ONLY set to ", process.env.ONLY, " => skipping subscribers");
    return emailLib.send(options.template || activity.type, process.env.ONLY, data, options)
  }
  return users.map(u => {
    if (!u) return;
    // skip users that have unsubscribed
    if (unsubscribedUserIds.indexOf(u.id) === -1) {
      debug("sendMessageFromActivity", activity.type, "UserId", u.id);

      switch (activity.type) {
        case activityType.COLLECTIVE_EXPENSE_CREATED:
          data.actions = {
            approve: u.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/approve`),
            reject: u.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/reject`)
          };
          break;

        case activityType.COLLECTIVE_CREATED:
          data.actions = {
            approve: u.generateLoginLink(`/${data.host.slug}/collectives/${data.collective.id}/approve`)
          };
          break;
      }
      return emailLib.send(options.template || activity.type, u.email, data, options)
    }
  });
}

async function notifyUserId(UserId, activity, options = {}) {
  const user = await models.User.findById(UserId);
  debug("notifyUserId", UserId, user && user.email, activity.type);

  if (activity.type === activityType.TICKET_CONFIRMED) {
    const event = await models.Collective.findById(activity.data.EventCollectiveId);
    const parentCollective = await event.getParentCollective();
    const ics = await event.getICS();
    options.attachments = [{ filename: `${event.slug}.ics`, content: ics }];
    activity.data.event = event.info;
    activity.data.collective = parentCollective.info;
    options.from = `${parentCollective.name} <hello@${parentCollective.slug}.opencollective.com>`;
  }

  return emailLib.send(activity.type, user.email, activity.data, options);
}

export async function notifyAdminsOfCollective(CollectiveId, activity, options = {}) {
  debug("notify admins of CollectiveId", CollectiveId);
  const collective = await models.Collective.findById(CollectiveId)
  if (!collective) {
    throw new Error(`notifyAdminsOfCollective> can't notify ${activity.type}: no collective found with id ${CollectiveId}`)
  }
  let adminUsers = await collective.getAdminUsers();
  if (options.exclude) {
    adminUsers = adminUsers.filter(u => options.exclude.indexOf(u.id) === -1);
  }
  debug("Total users to notify:", adminUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(adminUsers, activity, options);
}

async function w9bot(activity) {
  const HostCollectiveId = get(activity, 'data.host.id');
  const host = await models.Collective.findById(HostCollectiveId);

  if (!host) {
    throw new Error(`w9bot: Host id ${HostCollectiveId} not found`);
  }
  // Host is not USD based so it wont trigger the bot comment
  if (host.currency !== 'USD') return;

  // Host has already received form from the current user so it won't trigger
  if (get(host, 'data.W9.receivedFromUserIds') &&
      host.data.W9.receivedFromUserIds.includes(activity.data.user.id)) {
        return;
  }

  // ideally change to consider the current fiscal year instead(Example: might be from
  // march to february instead of from the beginning from january)
  const beginningOfCurrentYear = new Date(new Date().getFullYear(), 0, 1);
  const totalAmountThisYear = await models.Expense
    .getTotalExpensesFromUserIdInBaseCurrency(activity.data.user.id, host.currency, beginningOfCurrentYear);

  const w9Bot = await models.Collective.findOne({
    where: {
      slug: W9_BOT_SLUG,
    },
  });

  // U$ 600.00 total amount allowed without form as of July 2018
  const threshold = get(w9Bot, 'settings.W9.threshold');
  if (threshold && totalAmountThisYear > threshold) {
    const compiled = template(get(w9Bot, 'settings.W9.comment'), { interpolate: /{{([\s\S]+?)}}/g });
    const html = compiled({
      ExpenseId: activity.data.expense.id,
      UserId: activity.data.user.id,
      collective: activity.data.collective.name,
      host: activity.data.collective.name,
      fromName: activity.data.fromCollective.name,
      totalAmountThisYear: formatCurrency(totalAmountThisYear, 'USD'),
      expenseUrl: `${config.host.website}/${activity.data.collective.slug}/expenses/${activity.data.expense.id}`
    });

    const commentData = {
      CollectiveId: activity.data.collective.id,
      ExpenseId: activity.data.expense.id,
      FromCollectiveId: w9Bot.id,
      html,
    };
    // adding UserId to Host Data to keep track of all UserIds that received the request
    get(host, 'data.W9.requestSentToUserIds', []);
    host.data.W9.requestSentToUserIds.push(activity.data.user.id);
    host.update({ data: host.data });

    return models.Comment.create(commentData);
  }
  return true;
}

async function notifyMembersOfCollective(CollectiveId, activity, options) {
  debug("notify members of CollectiveId", CollectiveId);
  const collective = await models.Collective.findById(CollectiveId)
  const allUsers = await collective.getUsers();
  debug("Total users to notify:", allUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(allUsers, activity, options);
}

async function notifyByEmail(activity) {
  debug("notifyByEmail", activity.type);
  debugLib("activity.data")("activity.data", activity.data);
  switch (activity.type) {

    case activityType.TICKET_CONFIRMED:
      notifyUserId(activity.data.UserId, activity);
      break;

    case activityType.ORGANIZATION_COLLECTIVE_CREATED:
      notifyUserId(activity.UserId, activity);
      break;

    case activityType.COLLECTIVE_UPDATE_PUBLISHED:
      twitter.tweetActivity(activity);
      activity.data.update = await models.Update.findById(activity.data.update.id, {
        include: [ { model: models.Collective, as: "fromCollective" } ]
      });
      notifyMembersOfCollective(activity.data.update.CollectiveId, activity, { from: `hello@${activity.data.collective.slug}.opencollective.com` });
      break;

    case activityType.SUBSCRIPTION_CANCELED:
      return notifyUserId(activity.UserId, activity, { cc: `info@${activity.data.collective.slug}.opencollective.com` });

    case activityType.COLLECTIVE_MEMBER_CREATED:
      twitter.tweetActivity(activity);
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_EXPENSE_CREATED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      w9bot(activity);
      break;

    case activityType.COLLECTIVE_COMMENT_CREATED:
      activity.data.collective = await models.Collective.findById(activity.CollectiveId);
      activity.data.fromCollective = await models.Collective.findById(activity.data.FromCollectiveId);
      if (activity.data.ExpenseId) {
        activity.data.expense = await models.Expense.findById(activity.data.ExpenseId);
        activity.data.UserId = activity.data.expense.UserId;
        activity.data.path = `/${activity.data.collective.slug}/expenses/${activity.data.expense.id}`;
      } else {
        activity.data.update = await models.Update.findById(activity.data.UpdateId);
        activity.data.UserId = activity.data.update.CreatedByUserId;
        activity.data.path = `/${activity.data.collective.slug}/updates/${activity.data.update.slug}`;
      }
      // if the author of the comment is the one who submitted the expense
      if (activity.UserId === activity.data.UserId) {
        const HostCollectiveId = await activity.data.collective.getHostCollectiveId();
        // then, if the expense was already approved, we notify the admins of the host
        if (get(activity, 'data.expense.status') === 'APPROVED') {
          notifyAdminsOfCollective(HostCollectiveId, activity, { exclude: [activity.UserId] });
        } else {
          // or, if the expense hans't been approved yet, we notifiy the admins of the collective and the admins of the host
          notifyAdminsOfCollective(HostCollectiveId, activity, { exclude: [activity.UserId] });
          notifyAdminsOfCollective(activity.CollectiveId, activity, { exclude: [activity.UserId] });
        }
      } else {
        // if the comment was sent by one of the admins of the collective or the host, we just notify the author of the expense
        activity.data.recipientIsAuthor = true;
        notifyUserId(activity.data.UserId, activity);
      }
      // notify the author of the expense (unless it's their own comment)
      break;

    case activityType.COLLECTIVE_EXPENSE_APPROVED:
      activity.data.actions = {
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`
      };
      if (get(activity, 'data.expense.payoutMethod') === 'paypal') {
        activity.data.expense.payoutMethod = `PayPal (${activity.data.user.paypalEmail})`;
      }
      notifyUserId(activity.data.expense.UserId, activity);
      if (get(activity, 'data.host.id')) {
        notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.approved.for.host', collective: activity.data.host })
      }
      break;

    case activityType.COLLECTIVE_EXPENSE_PAID:
      activity.data.actions = {
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`
      }
      notifyUserId(activity.data.expense.UserId, activity);
      if (get(activity, 'data.host.id')) {
        notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.expense.paid.for.host', collective: activity.data.host })
      }
      break;

    case activityType.COLLECTIVE_APPROVED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_CREATED:
      if (get(activity, 'data.host.id')) {
        notifyAdminsOfCollective(activity.data.host.id, activity, { template: 'collective.created.for.host', collective: activity.data.host });
      }
      if ((get(activity, 'data.collective.tags') || []).includes('meetup')) {
        notifyAdminsOfCollective(activity.data.collective.id, activity, { template: 'collective.created.meetup' });
      } else {
        notifyAdminsOfCollective(activity.data.collective.id, activity);
      }
      break;

  }
}

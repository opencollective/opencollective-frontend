import axios from 'axios';
import config from 'config';
import Promise from 'bluebird';
import { get } from 'lodash';

import activitiesLib from '../lib/activities';
import slackLib from './slack';
import twitter from './twitter';
import emailLib from '../lib/email';
import activityType from '../constants/activities';
import models from '../models';
import debugLib from 'debug';
import { channels } from '../constants';
import { sanitizeActivity } from './webhooks';

const debug = debugLib('notification');

export default async (Sequelize, activity) => {
  // publish everything to our private channel
  publishToSlackPrivateChannel(activity).catch(console.log);

  // publish a filtered version to our public channel
  publishToSlack(activity, config.slack.webhookUrl, {
    channel: config.slack.publicActivityChannel,
  }).catch(console.log);

  notifyByEmail(activity).catch(console.log);

  // process notification entries for slack, twitter, gitter
  if (!activity.CollectiveId || !activity.type) {
    return;
  }
  const where = {
    CollectiveId: activity.CollectiveId,
    type: [activityType.ACTIVITY_ALL, activity.type],
    channel: Object.values(channels),
    active: true,
  };

  const notificationChannels = await models.Notification.findAll({ where });

  return Promise.map(notificationChannels, notifConfig => {
    if (notifConfig.channel === channels.GITTER) {
      return publishToGitter(activity, notifConfig);
    } else if (notifConfig.channel === channels.SLACK) {
      return publishToSlack(activity, notifConfig.webhookUrl, {});
    } else if (notifConfig.channel === channels.TWITTER) {
      return twitter.tweetActivity(activity);
    } else if (notifConfig.channel === channels.WEBHOOK) {
      return publishToWebhook(activity, notifConfig.webhookUrl);
    } else {
      return Promise.resolve();
    }
  }).catch(err => {
    console.error(
      `Error while publishing activity type ${activity.type} for collective ${activity.CollectiveId}`,
      activity,
      'error: ',
      err,
    );
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

function publishToWebhook(activity, webhookUrl) {
  const sanitizedActivity = sanitizeActivity(activity);
  return axios.post(webhookUrl, sanitizedActivity);
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
async function notifySubscribers(users, activity, options = {}) {
  const { data } = activity;

  // Generate Action links
  switch (activity.type) {
    case activityType.COLLECTIVE_EXPENSE_CREATED:
      data.actions = {
        approve: `${config.host.website}/${data.collective.slug}/expenses/${data.expense.id}/approve`,
        reject: `${config.host.website}/${data.collective.slug}/expenses/${data.expense.id}/reject`,
      };
      break;

    case activityType.COLLECTIVE_CREATED:
    case activityType.COLLECTIVE_APPLY:
      if (data.host) {
        data.actions = {
          approve: `${config.host.website}/${data.host.slug}/collectives/${data.collective.id}/approve`,
        };
      }
      break;
  }

  if (!users || users.length === 0) {
    debug('notifySubscribers: no user to notify for activity', activity.type);
    return;
  }
  debug('notifySubscribers', users.length, users.map(u => u && u.email, activity.type));
  const unsubscribedUserIds = await models.Notification.getUnsubscribersUserIds(
    get(options, 'template', activity.type),
    get(options, 'collective.id', activity.CollectiveId),
  );
  debug('unsubscribedUserIds', unsubscribedUserIds);
  if (process.env.ONLY) {
    debug('ONLY set to ', process.env.ONLY, ' => skipping subscribers');
    return emailLib.send(options.template || activity.type, process.env.ONLY, data, options);
  }
  return users.map(u => {
    if (!u) return;
    // skip users that have unsubscribed
    if (unsubscribedUserIds.indexOf(u.id) === -1) {
      debug('sendMessageFromActivity', activity.type, 'UserId', u.id);
      return emailLib.send(options.template || activity.type, u.email, data, options);
    }
  });
}

async function notifyUserId(UserId, activity, options = {}) {
  const user = await models.User.findByPk(UserId);
  debug('notifyUserId', UserId, user && user.email, activity.type);

  if (activity.type === activityType.TICKET_CONFIRMED) {
    const event = await models.Collective.findByPk(activity.data.EventCollectiveId);
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
  debug('notify admins of CollectiveId', CollectiveId);
  const collective = await models.Collective.findByPk(CollectiveId);
  if (!collective) {
    throw new Error(
      `notifyAdminsOfCollective> can't notify ${activity.type}: no collective found with id ${CollectiveId}`,
    );
  }
  let adminUsers = await collective.getAdminUsers();
  if (options.exclude) {
    adminUsers = adminUsers.filter(u => options.exclude.indexOf(u.id) === -1);
  }
  debug('Total users to notify:', adminUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(adminUsers, activity, options);
}

async function notifyMembersOfCollective(CollectiveId, activity, options) {
  debug('notify members of CollectiveId', CollectiveId);
  const collective = await models.Collective.findByPk(CollectiveId);
  const allUsers = await collective.getUsers();
  debug('Total users to notify:', allUsers.length);
  activity.CollectiveId = collective.id;
  return notifySubscribers(allUsers, activity, options);
}

async function notifyByEmail(activity) {
  debug('notifyByEmail', activity.type);
  debugLib('activity.data')('activity.data', activity.data);
  switch (activity.type) {
    case activityType.TICKET_CONFIRMED:
      notifyUserId(activity.data.UserId, activity);
      break;

    case activityType.ORGANIZATION_COLLECTIVE_CREATED:
      notifyUserId(activity.UserId, activity);
      break;

    case activityType.COLLECTIVE_UPDATE_PUBLISHED:
      twitter.tweetActivity(activity);
      activity.data.update = await models.Update.findByPk(activity.data.update.id, {
        include: [{ model: models.Collective, as: 'fromCollective' }],
      });
      notifyMembersOfCollective(activity.data.update.CollectiveId, activity, {
        from: `${activity.data.collective.name}
        <hello@${activity.data.collective.slug}.opencollective.com>`,
      });
      break;

    case activityType.SUBSCRIPTION_CANCELED:
      return notifyUserId(activity.UserId, activity, {
        cc: `info@${activity.data.collective.slug}.opencollective.com`,
      });

    case activityType.COLLECTIVE_MEMBER_CREATED:
      twitter.tweetActivity(activity);
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_EXPENSE_CREATED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_COMMENT_CREATED:
      activity.data.collective = await models.Collective.findByPk(activity.CollectiveId);
      activity.data.fromCollective = await models.Collective.findByPk(activity.data.FromCollectiveId);
      if (activity.data.ExpenseId) {
        activity.data.expense = await models.Expense.findByPk(activity.data.ExpenseId);
        activity.data.UserId = activity.data.expense.UserId;
        activity.data.path = `/${activity.data.collective.slug}/expenses/${activity.data.expense.id}`;
      } else {
        activity.data.update = await models.Update.findByPk(activity.data.UpdateId);
        activity.data.UserId = activity.data.update.CreatedByUserId;
        activity.data.path = `/${activity.data.collective.slug}/updates/${activity.data.update.slug}`;
      }
      // if the author of the comment is the one who submitted the expense
      if (activity.UserId === activity.data.UserId) {
        const HostCollectiveId = await activity.data.collective.getHostCollectiveId();
        // then, if the expense was already approved, we notify the admins of the host
        if (get(activity, 'data.expense.status') === 'APPROVED') {
          notifyAdminsOfCollective(HostCollectiveId, activity, {
            exclude: [activity.UserId],
          });
        } else {
          // or, if the expense hans't been approved yet, we notifiy the admins of the collective and the admins of the host
          notifyAdminsOfCollective(HostCollectiveId, activity, {
            exclude: [activity.UserId],
          });
          notifyAdminsOfCollective(activity.CollectiveId, activity, {
            exclude: [activity.UserId],
          });
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
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`,
      };
      if (get(activity, 'data.expense.payoutMethod') === 'paypal') {
        activity.data.expense.payoutMethod = `PayPal (${activity.data.user.paypalEmail})`;
      }
      notifyUserId(activity.data.expense.UserId, activity);
      // We only notify the admins of the host if the collective is active (ie. has been approved by the host)
      if (get(activity, 'data.host.id') && get(activity, 'data.collective.isActive')) {
        notifyAdminsOfCollective(activity.data.host.id, activity, {
          template: 'collective.expense.approved.for.host',
          collective: activity.data.host,
        });
      }
      break;

    case activityType.COLLECTIVE_EXPENSE_PAID:
      activity.data.actions = {
        viewLatestExpenses: `${config.host.website}/${activity.data.collective.slug}/expenses#expense${activity.data.expense.id}`,
      };
      notifyUserId(activity.data.expense.UserId, activity);
      if (get(activity, 'data.host.id')) {
        notifyAdminsOfCollective(activity.data.host.id, activity, {
          template: 'collective.expense.paid.for.host',
          collective: activity.data.host,
        });
      }
      break;

    case activityType.COLLECTIVE_APPROVED:
      notifyAdminsOfCollective(activity.data.collective.id, activity);
      break;

    case activityType.COLLECTIVE_APPLY:
      notifyAdminsOfCollective(activity.data.host.id, activity, {
        template: 'collective.apply.for.host',
      });
      notifyAdminsOfCollective(activity.data.collective.id, activity, {
        from: `hello@${activity.data.host.slug}.opencollective.com`,
      });
      break;

    case activityType.COLLECTIVE_CREATED:
      if ((get(activity, 'data.collective.tags') || []).includes('meetup')) {
        notifyAdminsOfCollective(activity.data.collective.id, activity, {
          template: 'collective.created.meetup',
        });
      } else {
        notifyAdminsOfCollective(activity.data.collective.id, activity);
      }
      break;

    case activityType.COLLECTIVE_CREATED_GITHUB:
      notifyAdminsOfCollective(activity.data.collective.id, activity, {
        template: 'collective.created.opensource',
      });
      break;
  }
}

import Promise from 'bluebird';
import { values } from 'lodash';
import config from 'config';
import models, { Op } from '../../../models';
import { activities, channels } from '../../../constants';

import { Forbidden, NotFound, Unauthorized } from '../../errors';

const NotificationPermissionError = new Forbidden({
  message: "This notification does not exist or you don't have the permission to edit it.",
});

const MaxWebhooksExceededError = new Forbidden({
  message: 'You have reached the webhooks limit for this collective.',
});

/**
 * Edits (by replacing) the admin-level webhooks for a collective.
 */
export async function editWebhooks(args, remoteUser) {
  if (!(remoteUser && remoteUser.isAdmin(args.collectiveId))) {
    throw NotificationPermissionError;
  }

  if (!args.notifications) return Promise.resolve();

  const oldNotifications = await models.Notification.findAll({
    where: { CollectiveId: args.collectiveId, UserId: null, channel: channels.WEBHOOK },
  });

  const toDelete = oldNotifications
    .filter(
      oldNotification =>
        !args.notifications.some(newNotification => {
          return (
            newNotification.type === oldNotification.type && newNotification.webhookUrl === oldNotification.webhookUrl
          );
        }),
    )
    .map(x => x.id);

  const toCreate = args.notifications.filter(
    newNotification =>
      !oldNotifications.some(oldNotification => {
        return (
          oldNotification.type === newNotification.type && oldNotification.webhookUrl === newNotification.webhookUrl
        );
      }),
  );

  models.Notification.destroy({ where: { id: { [Op.in]: toDelete } } });

  return Promise.map(toCreate, notification => {
    if (!(values(activities).includes(notification.type) && notification.channel === channels.WEBHOOK)) return;

    notification.CollectiveId = args.collectiveId;
    return models.Notification.create(notification);
  });
}

/**
 * Creates a Webhook subscription for a collective given a collective slug.
 */
export async function createWebhook(args, remoteUser) {
  if (!remoteUser) {
    throw new Unauthorized({ message: 'You need to be logged in to create a webhook.' });
  }

  const collective = await models.Collective.findOne({ where: { slug: args.collectiveSlug } });
  if (!collective) {
    throw new NotFound({ message: `Collective with slug: ${args.collectiveSlug} not found.` });
  }

  if (!remoteUser.isAdmin(collective.id)) {
    throw new Unauthorized({ message: 'You do not have permissions to create webhooks for this collective.' });
  }

  const { maxWebhooksPerUserPerCollective } = config.limits;
  const userWebhooksCount = await models.Notification.countRegisteredWebhooks(remoteUser.id, collective.id);

  if (userWebhooksCount >= maxWebhooksPerUserPerCollective) {
    throw MaxWebhooksExceededError;
  }

  const { webhookUrl, type } = args.notification;

  return models.Notification.create({
    UserId: remoteUser.id,
    CollectiveId: collective.id,
    channel: channels.WEBHOOK,
    type,
    webhookUrl,
  });
}

/**
 * Deletes a notification by ID.
 */
export async function deleteNotification(args, remoteUser) {
  if (!remoteUser) {
    throw new Unauthorized({ message: 'You need to be logged in as admin to delete a notification.' });
  }

  const notification = await models.Notification.findOne({ where: { id: args.id } });
  if (!notification) {
    throw new NotFound({ message: `Notification with ID ${args.id} not found.` });
  } else if (!remoteUser.isAdmin(notification.CollectiveId)) {
    throw new Unauthorized({ message: 'You need to be logged in as admin to delete this notification.' });
  }

  if (!(remoteUser.id === notification.UserId || remoteUser.isAdmin(notification.CollectiveId))) {
    throw NotificationPermissionError;
  }

  await notification.destroy();
  return notification;
}

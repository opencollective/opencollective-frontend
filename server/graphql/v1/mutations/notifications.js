import Promise from 'bluebird';
import { values } from 'lodash';
import models, { Op } from '../../../models';
import activities from '../../../constants/activities';
import { channels } from '../../../constants';
import { Forbidden } from '../../errors';

const NotificationPermissionError = new Forbidden({
  message: "This notification does not exist or you don't have the permission to edit it.",
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

    notification.CollectiveId = args.id;
    return models.Notification.create(notification);
  });
}

/**
 * Creates a new notification
 */
export async function createNotification(args, remoteUser) {
  if (!remoteUser) {
    throw NotificationPermissionError;
  }

  const { CollectiveId, webhookUrl, channel, type } = args.notification;

  return models.Notification.create({
    UserId: remoteUser.id,
    CollectiveId,
    webhookUrl,
    channel,
    type,
  });
}

/**
 * Creates a Webhook subscription for a collective given a collective slug.
 */
export function createWebhook(args, remoteUser) {
  const collective = models.Collective.find({ where: { slug: args.collectiveSlug } });

  args.notification.channel = channels.WEBHOOK;
  args.notification.CollectiveId = collective.id;

  return createNotification(args, remoteUser);
}

/**
 * Deletes a notification by ID.
 */
export async function deleteNotification(args, remoteUser) {
  if (!remoteUser) {
    throw NotificationPermissionError;
  }

  const notification = await models.Notification.find({ where: { id: args.id } });

  if (!(remoteUser.id === notification.UserId || remoteUser.isAdmin(notification.CollectiveId))) {
    throw NotificationPermissionError;
  }

  return models.Notification.destroy({ where: { id: args.id } });
}

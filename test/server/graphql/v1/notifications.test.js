import { expect } from 'chai';
import { describe, it } from 'mocha';
import config from 'config';

import models from '../../../../server/models';
import channels from '../../../../server/constants/channels';
import { activities, roles } from '../../../../server/constants';

import * as utils from '../../../utils';
import { randUrl } from '../../../stores';

describe('server/graphql/v1/notifications', () => {
  let user1, user2, collective1, notification;

  beforeEach(async () => {
    await utils.resetTestDB();
  });

  // Create test users
  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user1 = u)));
  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));

  // Create test collective
  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(c => (collective1 = c)));

  // Set `user1` as collective admin
  beforeEach(() => collective1.addUserWithRole(user1, roles.ADMIN));

  // Create test notification
  beforeEach(() =>
    models.Notification.create({
      channel: channels.WEBHOOK,
      type: activities.COLLECTIVE_EXPENSE_CREATED,
      webhookUrl: randUrl(),
      UserId: user1.id,
      CollectiveId: collective1.id,
    }).tap(n => (notification = n)),
  );

  describe('create webhook notifications', () => {
    const createWebhookQuery = `
      mutation createWebhook($collectiveSlug: String!, $notification: NotificationInputType!) {
        createWebhook(collectiveSlug: $collectiveSlug, notification: $notification) {
          id
        }
      }
    `;

    const notification = () => ({
      type: activities.COLLECTIVE_EXPENSE_CREATED,
      webhookUrl: randUrl(),
    });

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(createWebhookQuery, {
        collectiveSlug: collective1.slug,
        notification: notification(),
      });

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You need to be logged in to create a webhook.');
    });

    it('fails for non-existent collective', async () => {
      const result = await utils.graphqlQuery(
        createWebhookQuery,
        {
          collectiveSlug: 'idontexist',
          notification: notification(),
        },
        user1,
      );

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('Collective with slug: idontexist not found.');
    });

    it('return error when webhook limit exceeded', async () => {
      const { maxWebhooksPerUserPerCollective } = config.limits;
      await Promise.all(
        Array.from(Array(maxWebhooksPerUserPerCollective)).map(() => {
          return utils.graphqlQuery(
            createWebhookQuery,
            {
              collectiveSlug: collective1.slug,
              notification: notification(),
            },
            user1,
          );
        }),
      );

      const result = await utils.graphqlQuery(
        createWebhookQuery,
        {
          collectiveSlug: collective1.slug,
          notification: notification(),
        },
        user1,
      );

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You have reached the webhooks limit for this collective.');
    });

    it('creates webhook notification', async () => {
      const notification = {
        type: activities.COLLECTIVE_EXPENSE_CREATED,
        webhookUrl: randUrl(),
      };

      const result = await utils.graphqlQuery(
        createWebhookQuery,
        { collectiveSlug: collective1.slug, notification },
        user1,
      );

      result.errors && console.error(result.errors);

      expect(result.errors).to.not.exist;

      const { createWebhook } = result.data;
      const newWebhook = await models.Notification.findByPk(createWebhook.id);

      expect(newWebhook.webhookUrl).to.equal(notification.webhookUrl);
      expect(newWebhook.channel).to.equal(channels.WEBHOOK);
      expect(newWebhook.active).to.equal(true);
      expect(newWebhook.UserId).to.equal(user1.id);
      expect(newWebhook.CollectiveId).to.equal(collective1.id);
    });
  });

  describe('delete webhook notifications', () => {
    const deleteWebhookQuery = `
      mutation deleteNotification($id: Int!) {
        deleteNotification(id: $id) {
          id
        }
      }
    `;

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(deleteWebhookQuery, { id: notification.id });

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You need to be logged in as admin to delete a notification.');
      return models.Notification.findByPk(notification.id).then(notification => {
        expect(notification).to.not.be.null;
      });
    });

    it('fails for non-existent notification', async () => {
      const result = await utils.graphqlQuery(deleteWebhookQuery, { id: 2 }, user1);

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('Notification with ID 2 not found.');
    });

    it("fails when deleting other user's notification", async () => {
      const result = await utils.graphqlQuery(deleteWebhookQuery, { id: notification.id }, user2);

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('You need to be logged in as admin to delete this notification.');
      return models.Notification.findByPk(notification.id).then(notification => {
        expect(notification).to.not.be.null;
      });
    });

    it('deletes notification', async () => {
      const result = await utils.graphqlQuery(deleteWebhookQuery, { id: notification.id }, user1);

      expect(result.errors).to.not.exist;
      expect(result.data.deleteNotification.id).to.equal(notification.id);
      return models.Notification.findByPk(notification.id).then(notification => {
        expect(notification).to.be.null;
      });
    });
  });
});

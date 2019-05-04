import { expect } from 'chai';
import { describe, it } from 'mocha';
import config from 'config';
import * as utils from './utils';
import models from '../server/models';
import channels from '../server/constants/channels';
import { activities } from '../server/constants';
import { randUrl } from './features/support/stores';

describe('graphql.notifications.test', () => {
  let user1, collective1;

  beforeEach(async () => {
    await utils.resetTestDB();
  });

  // Create test user
  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user1 = u)));

  // Create test collective
  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => (collective1 = g)));

  describe('create notifications', () => {
    const createWebhookQuery = `
      mutation createWebhook($collectiveSlug: String!, $notification: NotificationInputType!) {
        createWebhook(collectiveSlug: $collectiveSlug, notification: $notification) {
          id
        }
      }
    `;

    const notification = () => ({
      channel: channels.WEBHOOK,
      type: activities.COLLECTIVE_EXPENSE_CREATED,
      webhookUrl: randUrl(),
    });

    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(createWebhookQuery, {
        collectiveSlug: collective1.slug,
        notification: notification(),
      });

      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal(
        "This notification does not exist or you don't have the permission to edit it.",
      );
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
  });
});

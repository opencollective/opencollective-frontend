import Promise from 'bluebird';
import { defaults } from 'lodash';
import debugLib from 'debug';
import { Op } from 'sequelize';

import channels from '../constants/channels';

const debug = debugLib('models:Notification');

export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const Notification = Sequelize.define(
    'Notification',
    {
      channel: {
        defaultValue: 'email',
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [Object.values(channels)],
            msg: `Must be one of ${Object.values(channels).join(', ')}`,
          },
        },
      },

      type: {
        type: DataTypes.STRING,
        // Can't do what's bellow because of the `mailinglist.___` thing
        // See https://github.com/opencollective/opencollective-api/blob/f8ac13a1b8176a69d4ea380bcfcca1bd789889b0/server/controllers/services/email.js#L155
        // validate: {
        //   isIn: {
        //     args: [Object.values(activities)],
        //     msg: `Must be one of ${Object.values(activities).join(', ')}`,
        //   },
        // },
      },

      active: {
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
      },

      UserId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Users' },
      },

      webhookUrl: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true,
        },
        set(url) {
          if (!url) {
            this.setDataValue('webhookUrl', null);
          } else {
            // Enforce 'https://`
            this.setDataValue('webhookUrl', `https://${url.replace(/https?:\/\//, '')}`);
          }
        },
      },
    },
    {
      indexes: [
        {
          fields: ['channel', 'type', 'webhookUrl', 'CollectiveId'],
          type: 'unique',
        },
      ],
    },
  );

  Notification.schema('public');

  Notification.prototype.getUser = function() {
    return models.User.findByPk(this.UserId);
  };

  Notification.createMany = (notifications, defaultValues) => {
    return Promise.map(notifications, u => Notification.create(defaults({}, u, defaultValues))).catch(console.error);
  };

  /**
   * Get the list of subscribers to a mailing list
   * (e.g. backers@:collectiveSlug.opencollective.com, :eventSlug@:collectiveSlug.opencollective.com)
   * We exclude users that have unsubscribed (by looking for rows in the Notifications table that are active: false)
   */
  Notification.getSubscribers = async (collectiveSlug, mailinglist) => {
    const findByAttribute = isNaN(collectiveSlug) ? 'findBySlug' : 'findById';
    const collective = await models.Collective[findByAttribute](collectiveSlug);

    const getMembersForEvent = mailinglist =>
      models.Collective.findOne({
        where: { slug: mailinglist, type: 'EVENT' },
      }).then(event => {
        if (!event) {
          throw new Error('mailinglist_not_found');
        }
        debug('getMembersForEvent', event.slug);
        return event.getMembers();
      });

    debug('getSubscribers', findByAttribute, collectiveSlug, 'found:', collective.slug, 'mailinglist:', mailinglist);
    const excludeUnsubscribed = members => {
      debug('excludeUnsubscribed: need to filter', members && members.length, 'members');
      if (!members || members.length === 0) {
        return [];
      }

      return Notification.getUnsubscribersUserIds(`mailinglist.${mailinglist}`, collective.id).then(excludeIds => {
        debug('excluding', excludeIds.length, 'members');
        return members.filter(m => excludeIds.indexOf(m.CreatedByUserId) === -1);
      });
    };

    const getMembersForMailingList = () => {
      switch (mailinglist) {
        case 'backers':
          return collective.getMembers({ where: { role: 'BACKER' } });
        case 'admins':
          return collective.getMembers({ where: { role: 'ADMIN' } });
        default:
          return getMembersForEvent(mailinglist);
      }
    };

    return getMembersForMailingList().then(excludeUnsubscribed);
  };

  Notification.getSubscribersUsers = async (collectiveSlug, mailinglist) => {
    debug('getSubscribersUsers', collectiveSlug, mailinglist);
    const getUsers = memberships => {
      if (!memberships || memberships.length === 0) {
        return [];
      }
      return models.User.findAll({
        where: {
          CollectiveId: { [Op.in]: memberships.map(m => m.MemberCollectiveId) },
        },
      });
    };

    return await Notification.getSubscribers(collectiveSlug, mailinglist).then(getUsers);
  };

  Notification.getSubscribersCollectives = async (collectiveSlug, mailinglist) => {
    debug('getSubscribersCollectives', collectiveSlug, mailinglist);
    const getCollectives = memberships => {
      if (!memberships || memberships.length === 0) {
        return [];
      }
      return models.Collective.findAll({
        where: {
          id: { [Op.in]: memberships.map(m => m.MemberCollectiveId) },
        },
      });
    };

    return await Notification.getSubscribers(collectiveSlug, mailinglist).then(getCollectives);
  };

  /**
   * Get an array of all the UserId that have unsubscribed from the `notificationType` notification for (optional) CollectiveId
   * @param {*} notificationType
   * @param {*} CollectiveId (optional)
   */
  Notification.getUnsubscribersUserIds = (notificationType, CollectiveId) => {
    debug('getUnsubscribersUserIds', notificationType, CollectiveId);
    return models.Notification.findAll({
      where: {
        CollectiveId,
        type: notificationType,
        active: false,
      },
    }).then(us => us.map(us => us.UserId));
  };
  /**
   * Check if notification with `notificationType` and `user` is active.
   * @param {*} notificationType
   * @param {*} user
   * @param {*} [collective]
   */
  Notification.isActive = (notificationType, user, collective) => {
    debug('isActive', notificationType, user.id);
    const where = {
      type: notificationType,
      UserId: user.id,
    };

    if (collective && collective.id) {
      where.CollectiveId = collective.id;
    }

    return models.Notification.findOne({ where }).then(notification => {
      if (notification) {
        return notification.active;
      } else {
        return true;
      }
    });
  };

  /**
   * Counts registered webhooks for a user, for a collective.
   * @param {number} UserId
   * @param {number} CollectiveId
   * @returns {Promise<number>} count
   */
  Notification.countRegisteredWebhooks = CollectiveId => {
    return models.Notification.count({ where: { CollectiveId, channel: channels.WEBHOOK } });
  };

  return Notification;
}

/*
Types:
  + activities.USER_CREATED
      data: user.info
      UserId: the one created
  - user.updated
      data: user (updated values)
      UserId: the one updated
  - user.confirm_email
      data: user.email
      UserId: the user

  - user.paymentMethod.created
      data: user, paymentMethod
      UserId: the one who added the paymentMethod = the paymentMethod's owner
  - user.paymentMethod.updated
      data: user, paymentMethod (updated values)
  - user.paymentMethod.deleted
      data: user, paymentMethod.name (only 4 last number)

  + collective.created
      data: collective, user.info
      UserId: the creator
  - collective.updated
      data: collective (updated values), user.info
  - collective.deleted
      data: collective.name, user.info

  + collective.user.added
      data: collective, user (caller), target (the new user), collectiveuser
      2* Userid: the new user + the caller
  - collective.user.updated
      data: collective, user (caller), target (the updated user), collectiveuser (updated values)
      2* Userid: the updated user + the caller
  - collective.user.deleted
      data: collective, user (caller), target (the  deleted user)
      2* Userid: the deleted user + the caller

  - activities.COLLECTIVE_TRANSACTION_CREATED
      data: collective, transaction, user (the caller), target (potentially)
      UserId: the one who initiate the transaction
      CollectiveId:
      TransactionId:
  - collective.transaction.deleted
      data: collective, transaction, user (the caller)
      UserId: the one who initiate the delete
      CollectiveId:
      TransactionId:
  - activities.COLLECTIVE_EXPENSE_PAID
      data: collective, transaction, user (the caller), pay (paypal payload)
      UserId:
      CollectiveId:
      TransactionId:
*/

/*
 * Create a notification to receive certain type of events
 *
 * Notification.create({
 *  UserId, CollectiveId, type = 'collective.transaction.created', channel='email'
 * })
 * Notification.unsubscribe(); // To disable a notification
 */
import Promise from 'bluebird';
import _ from 'lodash';
import debugLib from 'debug';
const debug = debugLib('notification');

export default function(Sequelize, DataTypes) {
  const { models, Op } = Sequelize;

  const Notification = Sequelize.define(
    'Notification',
    {
      channel: { defaultValue: 'email', type: DataTypes.STRING }, // in the future: Slack, iPhone, Android, etc.

      type: DataTypes.STRING,

      active: { defaultValue: true, type: DataTypes.BOOLEAN },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      webhookUrl: {
        type: DataTypes.STRING,
      },
    },
    {
      indexes: [
        {
          fields: ['type', 'CollectiveId', 'UserId'],
          type: 'unique',
        },
      ],
    },
  );

  Notification.createMany = (notifications, defaultValues) => {
    return Promise.map(notifications, u => Notification.create(_.defaults({}, u, defaultValues))).catch(console.error);
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
        if (!event) throw new Error('mailinglist_not_found');
        debug('getMembersForEvent', event.slug);
        return event.getMembers();
      });

    debug('getSubscribers', findByAttribute, collectiveSlug, 'found:', collective.slug, 'mailinglist:', mailinglist);
    const excludeUnsubscribed = members => {
      debug('excludeUnsubscribed: need to filter', members && members.length, 'members');
      if (!members || members.length === 0) return [];

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
      if (!memberships || memberships.length === 0) return [];
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
      if (!memberships || memberships.length === 0) return [];
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
      data: collective, user (caller), target (the deleted user)
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

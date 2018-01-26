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
import roles from '../constants/roles';
import activities from '../constants/activities';

export default function(Sequelize, DataTypes) {

  const models = Sequelize.models;

  const Notification = Sequelize.define('Notification', {

    channel: { defaultValue: 'email', type: DataTypes.STRING }, // in the future: Slack, iPhone, Android, etc.

    type: DataTypes.STRING,

    active: { defaultValue: true, type: DataTypes.BOOLEAN },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    webhookUrl: {
      type: DataTypes.STRING
    }
  }, {
    indexes: [{
      fields: ['type', 'CollectiveId', 'UserId'],
      type: 'unique'
    }],

  });

  Notification.createMany = (notifications, defaultValues) => {
    return Promise.map(notifications, u => Notification.create(_.defaults({},u,defaultValues))).catch(console.error);
  };

  Notification.subscribeCollectiveWithRole = (collective, CollectiveId, role) => {
    return collective.getAdminUsers().then(adminUsers => {
      return Promise.each(adminUsers, adminUser => Notification.subscribeUserWithRole(adminUser.id, CollectiveId, role));
    });
  }

  Notification.subscribeUserWithRole = (UserId, CollectiveId, role) => {

    if (!UserId) {
      throw new Error("Notification.subscribeUserWithRole UserId missing");
    }

    const notifications = [], lists = {};

    lists[roles.BACKER] = 'backers';
    lists[roles.ADMIN] = 'admins';
    lists[roles.HOST] = 'host';

    if (lists[role]) {
      notifications.push({ type: `mailinglist.${lists[role]}` });
    }

    switch (role) {
      case roles.HOST:
        notifications.push({ type: activities.COLLECTIVE_EXPENSE_CREATED });
        notifications.push({ type: activities.COLLECTIVE_TRANSACTION_CREATED });
        break;
      case roles.ADMIN:
        notifications.push({ type: activities.COLLECTIVE_EXPENSE_CREATED });
        notifications.push({ type: activities.COLLECTIVE_MEMBER_CREATED });
        notifications.push({ type: 'collective.monthlyreport' });
        break;
    }

    return Promise.map(notifications, (notification) => {
      return models.Notification
        .create({ ...notification, UserId: UserId, CollectiveId: CollectiveId, channel: 'email' })
        .catch(e => console.error(e.name, `User ${UserId} is already subscribed to ${notification.type}`))
    })
    .catch(e => console.error(`Collective.addUserWithRole error while creating entries in Notifications table for UserId ${UserId} (role: ${role}, CollectiveId: ${CollectiveId}): `, e));
  }

  /**
   * Get the list of subscribers to a mailing list
   * (e.g. backers@:collectiveSlug.opencollective.com, :eventSlug@:collectiveSlug.opencollective.com)
   * We exclude users that have unsubscibed (by looking for rows in the Notifications table that are active: false)
   */
  Notification.getSubscribers = async (collectiveSlug, mailinglist) => {

    const findByAttribute = isNaN(collectiveSlug) ? "findBySlug" : "findById";
    const collective = await models.Collective[findByAttribute](collectiveSlug);

    const getMembersForEvent = (mailinglist) => models.Collective
    .findOne({ where: { slug: mailinglist, type: 'EVENT' } })
    .then(event => {
      if (event) return event.getMembers();
    });

    const excludeUnsubscribed = (members) => {
      if (!members || members.length === 0) return [];

      return models.Notification.findAll({
          where: {
            channel: 'email',
            active: false,
            type: `mailinglist.${mailinglist}`
          },
          include: [ { model: models.Collective, where: { slug: mailinglist } } ]
        })
        .then(notifications => notifications.map(s => s.UserId ))
        .then(excludeIds => {
          return members.filter(m => excludeIds.indexOf(m.CreatedByUserId) === -1)
        });
      }

    const getMembersForMailingList = () => {
      switch (mailinglist) {
        case 'backers':
          return collective.getMembers({ where: { role: 'BACKER'}});
        case 'admins':
          return collective.getMembers({ where: { role: 'ADMIN'}});
        default:
          return getMembersForEvent(mailinglist);
      }
    }

    return getMembersForMailingList().then(excludeUnsubscribed);
  }

  Notification.getSubscribersUsers = async (collectiveSlug, mailinglist) => {
    const getUsers = (memberships) => {
      if (!memberships || memberships.length === 0) return [];
      return models.User.findAll({ where: { CollectiveId: { $in: memberships.map(m => m.MemberCollectiveId )}}});
    }

    return await Notification.getSubscribers(collectiveSlug, mailinglist).then(getUsers);
  }

  /**
   * Get an array of all the UserId that have unsubscribed from the `notificationType` notification for (optional) CollectiveId
   * @param {*} notificationType 
   * @param {*} CollectiveId (optional)
   */
  Notification.getUnsubscribers = (notificationType, CollectiveId) => {
    return models.Notification.findAll({
      where: {
        CollectiveId: CollectiveId,
        type: notificationType,
        active: false
      }
    }).then(us => us.map(us => us.UserId));
  }

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

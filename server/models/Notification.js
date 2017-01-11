/*
 * Create a notification to receive certain type of events
 *
 * Notification.create({
 *  UserId, GroupId, type = 'group.transaction.created', channel='email'
 * })
 * Notification.unsubscribe(); // To disable a notification
 */
import Promise from 'bluebird';
import _ from 'lodash';

export default function(Sequelize, DataTypes) {

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
    defaultScope: {
      where: { active: true }
    },

    indexes: [{
      fields: ['type', 'GroupId', 'UserId'],
      type: 'unique'
    }],

    classMethods: {
      createMany: (notifications, defaultValues) => {
        return Promise.map(notifications, u => Notification.create(_.defaults({},u,defaultValues)), {concurrency: 1}).catch(console.error);
      }
    }

  });

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
      data: user, paymentMethod.number (only 4 last number)

  + group.created
      data: group, user.info
      UserId: the creator
  - group.updated
      data: group (updated values), user.info
  - group.deleted
      data: group.name, user.info

  + group.user.added
      data: group, user (caller), target (the new user), groupuser
      2* Userid: the new user + the caller
  - group.user.updated
      data: group, user (caller), target (the updated user), groupuser (updated values)
      2* Userid: the updated user + the caller
  - group.user.deleted
      data: group, user (caller), target (the deleted user)
      2* Userid: the deleted user + the caller

  - activities.GROUP_TRANSACTION_CREATED
      data: group, transaction, user (the caller), target (potentially)
      UserId: the one who initiate the transaction
      GroupId:
      TransactionId:
  - group.transaction.deleted
      data: group, transaction, user (the caller)
      UserId: the one who initiate the delete
      GroupId:
      TransactionId:
  - activities.GROUP_EXPENSE_PAID
      data: group, transaction, user (the caller), pay (paypal payload)
      UserId:
      GroupId:
      TransactionId:
*/

var User = require('./User');
var Group = require('./Group');

/*
 * Create a subscription to receive notifications for a certain type of events
 *
 * Subscription.create({
 *  UserId, GroupId, type = 'group.transaction.created', channel='email'
 * })
 * Subscription.unsubscribe(); // To disable a subscription
 */

module.exports = function(Sequelize, DataTypes) {

  var Subscription = Sequelize.define('Subscription', {

    channel: { defaultValue: 'email', type: DataTypes.ENUM('email') }, // in the future: iPhone, Android, etc.

    type: DataTypes.STRING,

    active: { defaultValue: true, type: DataTypes.BOOLEAN },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    defaultScope: {
      where: { active: true }
    },

    indexes: [{
      fields: ['type', 'GroupId', 'UserId'],
      type: 'unique'
    }]

  });

  return Subscription;
};

/*
Types:
  + user.created
      data: user.info
      UserId: the one created
  - user.updated
      data: user (updated values)
      UserId: the one updated
  - user.confirm_email
      data: user.email
      UserId: the user

  - user.card.created
      data: user, card
      UserId: the one who added the card = the card's owner
  - user.card.updated
      data: user, card (updated values)
  - user.card.deleted
      data: user, card.number (only 4 last number)

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

  - group.transaction.created
      data: group, transaction, user (the caller), target (potentially)
      UserId: the one who initiate the transaction
      GroupId:
      TransactionId:
  - group.transaction.deleted
      data: group, transaction, user (the caller)
      UserId: the one who initiate the delete
      GroupId:
      TransactionId:
  - group.transaction.paid
      data: group, transaction, user (the caller), pay (paypal payload)
      UserId:
      GroupId:
      TransactionId:
*/

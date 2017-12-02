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

  /**
   * Get the list of subscribers to a mailing list (e.g. backers@:collectiveSlug.opencollective.com)
   * For members, backers, and info: opt-in: we look for rows in the Notifications table
   * For events, it's opt-out. We exclude people who have explicitly unsubscribed
   */
  Notification.getSubscribers = (collectiveSlug, mailinglist) => {

    const getSubscribersForMailingList = () =>
      models.Notification.findAll(
          {
            where: {
              channel: 'email',
              type: `mailinglist.${mailinglist}`,
              active: true
            },
            include: [
              { model: models.User },
              { model: models.Collective, where: { slug: collectiveSlug } }
            ]
          }
        )
        .then(subscriptions => subscriptions.map(s => s.User))        

    const getUsers = (memberships) => {
      return models.User.findAll({ where: { CollectiveId: { $in: memberships.map(m => m.MemberCollectiveId )}}});
    }

    const getSubscribersForEvent = () => models.Collective
      .findOne({
        where: { slug: mailinglist, type: 'EVENT' }
      })
      .then(event => {
          if (event) return event.getMembers().then(excludeUnsubscribed).then(getUsers)
      })

    const excludeUnsubscribed = (members) => 
      models.Notification.findAll({
        where: {
          channel: 'email',
          active: false,
          type: `mailinglist`
        },
        include: [ { model: models.Collective, where: { slug: mailinglist } } ]
      }).then(notifications => notifications.map(s => s.UserId ))
      .then(excludeIds => {
        return members.filter(m => excludeIds.indexOf(m.CreatedByUserId) === -1)
      })

    return getSubscribersForEvent()
    .then(subscribers => {
      if (!subscribers) return getSubscribersForMailingList(mailinglist)
      else return subscribers;
    });
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

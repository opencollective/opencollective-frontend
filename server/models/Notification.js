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
    defaultScope: {
      where: { active: true }
    },

    indexes: [{
      fields: ['type', 'CollectiveId', 'UserId'],
      type: 'unique'
    }],

    classMethods: {
      createMany: (notifications, defaultValues) => {
        return Promise.map(notifications, u => Notification.create(_.defaults({},u,defaultValues))).catch(console.error);
      },

      /**
       * Get the list of subscribers to a mailing list (e.g. backers@:collectiveSlug.opencollective.com)
       * For members, backers, and info: opt-in: we look for rows in the Notifications table
       * For events, it's opt-out. We exclude people who have explicitly unsubscribed
       */
      getSubscribers: (collectiveSlug, mailinglist) => {

        const getSubscribersForMailingList = (mailinglist) =>
          models.Notification.findAll(
              {
                where: {
                  channel: 'email',
                  type: `mailinglist.${mailinglist}`
                },
                include: [{model: models.User }, {model: models.Collective, where: { slug: collectiveSlug } }]
              }
            )
            .then(subscriptions => subscriptions.map(s => s.User))        

        const getSubscribersForEvent = (eventSlug) =>
          models.Event.findOne({
           where: { slug: eventSlug },
           include: [
             { model: models.Collective, where: { slug: collectiveSlug } }
           ]
          })
          .then(event => {
              if (event) return event.getUsers().then(excludeUnsubscribed)
          })

        const excludeUnsubscribed = (users) =>
          models.Notification.findAll({
            where: {
              channel: 'email',
              active: false,
              type: `mailinglist.${mailinglist}`
            },
            include: [ { model: models.Collective, where: { slug: collectiveSlug } } ]
          }).then(subscriptions => subscriptions.map(s => s.UserId ))
          .then(excludeIds => {
            return users.filter(u => excludeIds.indexOf(u.id) === -1)
          })

        return getSubscribersForEvent(mailinglist)
        .then(subscribers => {
          if (!subscribers) return getSubscribersForMailingList(mailinglist)
          else return subscribers;
        });
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

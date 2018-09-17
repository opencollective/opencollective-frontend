import notify from '../lib/notifications';

export default function(Sequelize, DataTypes) {
  const Activity = Sequelize.define(
    'Activity',
    {
      type: DataTypes.STRING,

      data: DataTypes.JSON,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      updatedAt: false,

      hooks: {
        afterCreate(activity) {
          notify(Sequelize, activity); // intentionally no return statement, needs to be async
        },
      },
    },
  );

  return Activity;
}

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

  - constants.COLLECTIVE_TRANSACTION_CREATED
      data: collective, transaction, user (the caller), target (potentially)
      UserId: the one who initiate the transaction
      CollectiveId:
      TransactionId:
  - collective.transaction.deleted
      data: collective, transaction, user (the caller)
      UserId: the one who initiate the delete
      CollectiveId:
      TransactionId:
  - constants.COLLECTIVE_EXPENSE_PAID
      data: collective, transaction, user (the caller), pay (paypal payload)
      UserId:
      CollectiveId:
      TransactionId:

  + constants.WEBHOOK_STRIPE_RECEIVED
    data: event (from Stripe)
*/

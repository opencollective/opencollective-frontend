import Promise from 'bluebird';
import activities from '../constants/activities';
import uuid from 'uuid';
import { type } from '../constants/transactions';

/*
 * Transaction model
 * - this indicates that money was moved in the system
 */
export default (Sequelize, DataTypes) => {

  const Transaction = Sequelize.define('Transaction', {
    uuid: DataTypes.STRING(36),
    type: DataTypes.STRING, // Expense or Donation
    description: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    // Keeps a reference to the host because this is where the bank account is
    // Note that the host can also change over time (that's why just keeping GroupId is not enough)
    HostId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    GroupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    // stores the currency that the transaction happened in (currency of the donor)
    txnCurrency: {
      type: DataTypes.STRING,
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('txnCurrency', val.toUpperCase());
        }
      }
    },

    // stores the foreign exchange rate at the time of transaction between donation currency and transaction currency
    // txnCurrencyFxRate = amount/amountInTxnCurrency
    txnCurrencyFxRate: DataTypes.FLOAT,

    // amount in currency of the host
    amountInTxnCurrency: DataTypes.INTEGER,
    platformFeeInTxnCurrency: DataTypes.INTEGER,
    hostFeeInTxnCurrency: DataTypes.INTEGER,
    paymentProcessorFeeInTxnCurrency: DataTypes.INTEGER,
    netAmountInGroupCurrency: DataTypes.INTEGER, // stores the net amount received by the group

    data: DataTypes.JSON,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {

      netAmountInTxnCurrency() {
        return this.amountInTxnCurrency - this.paymentProcessorFeeInTxnCurrency - this.platformFeeInTxnCurrency
      },

      // Info.
      info() {
        return {
          id: this.id,
          uuid: this.uuid,
          type: this.type,
          description: this.description,
          amount: this.amount,
          currency: this.currency,
          createdAt: this.createdAt,
          UserId: this.UserId,
          GroupId: this.GroupId,
          platformFee: this.platformFee,
          hostFee: this.hostFee,
          paymentProcessorFee: this.paymentProcessorFee,
          amountInTxnCurrency: this.amountInTxnCurrency,
          netAmountInGroupCurrency: this.netAmountInGroupCurrency,
          netAmountInTxnCurrency: this.netAmountInTxnCurrency,
          txnCurrency: this.txnCurrency
        };
      }
    },

    classMethods: {

      createMany: (transactions, defaultValues) => {
        return Promise.map(transactions, transaction => {
          for (const attr in defaultValues) {
            transaction[attr] = defaultValues[attr];
          }
          return Transaction.create(transaction);
        }).catch(console.error);
      },

      createFromPayload({ transaction, user, group, paymentMethod }) {

        return group.getHost().then(host => {
          transaction.HostId = host.id;
          // attach other objects manually. Needed for afterCreate hook to work properly
          transaction.UserId = user && user.id;
          transaction.GroupId = group && group.id;
          transaction.PaymentMethodId = transaction.PaymentMethodId || (paymentMethod ? paymentMethod.id : null);
          transaction.type = (transaction.amount > 0) ? type.DONATION : type.EXPENSE;

          if (transaction.amount > 0 && transaction.txnCurrencyFxRate) {
            // populate netAmountInGroupCurrency for donations
            // @aseem: why the condition on && transaction.txnCurrencyFxRate ?
              transaction.netAmountInGroupCurrency =
                Math.round((transaction.amountInTxnCurrency
                  - transaction.platformFeeInTxnCurrency
                  - transaction.hostFeeInTxnCurrency
                  - transaction.paymentProcessorFeeInTxnCurrency)
                *transaction.txnCurrencyFxRate);
          }
          return Transaction.create(transaction);
        });
      },

      createActivity(transaction) {
        if (transaction.deletedAt) {
          return Promise.resolve();
        }
        return Transaction.findById(transaction.id, {
          include: [
            { model: Sequelize.models.Group },
            { model: Sequelize.models.User },
            { model: Sequelize.models.PaymentMethod }
          ]
        })
        // Create activity.
        .then(transaction => {

          const activityPayload = {
            type: activities.GROUP_TRANSACTION_CREATED,
            TransactionId: transaction.id,
            GroupId: transaction.GroupId,
            UserId: transaction.UserId,
            data: {
              transaction: transaction.info,
              user: transaction.User && transaction.User.minimal,
              group: transaction.Group && transaction.Group.minimal
            }
          };
          if (transaction.User) {
            activityPayload.data.user = transaction.User.info;
          }
          if (transaction.PaymentMethod) {
            activityPayload.data.paymentMethod = transaction.PaymentMethod.info;
          }
          return Sequelize.models.Activity.create(activityPayload);
        })
        .catch(err => console.error(`Error creating activity of type ${activities.GROUP_TRANSACTION_CREATED} for transaction ID ${transaction.id}`, err));
      }
    },

    hooks: {
      beforeCreate: (transaction) => {
        transaction.uuid = uuid.v4();
        return transaction;
      },

      afterCreate: (transaction) => {
        Transaction.createActivity(transaction);
        // intentionally returns null, needs to be async (https://github.com/petkaantonov/bluebird/blob/master/docs/docs/warning-explanations.md#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it)
        return null;
      }
    }
  });

  return Transaction;
};

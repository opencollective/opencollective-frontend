const Promise = require('bluebird');
const _ = require('lodash');
const activities = require('../constants/activities');

/*
 * Transaction model
 * - this indicates that money was moved in the system
 */

module.exports = (Sequelize, DataTypes) => {

  const Transaction = Sequelize.define('Transaction', {
    type: DataTypes.STRING, // Expense or Donation
    description: DataTypes.STRING, // delete #postmigration
    amount: DataTypes.FLOAT, // TODO: change to INTEGER and rename to donationAmount
    vat: DataTypes.FLOAT, // delete #postmigration
    currency: { // TODO: #postmigration rename to donationCurrency
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },
    vendor: DataTypes.STRING, // delete #postmigration
    paidby: DataTypes.STRING, // delete #postmigration
    tags: DataTypes.ARRAY(DataTypes.STRING),
    status: DataTypes.STRING, // delete #postmigration
    comment: DataTypes.STRING, // delete #postmigration
    link: DataTypes.STRING, // delete #postmigration

    payoutMethod: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['paypal', 'manual', 'other']],
          msg: 'Must be paypal, manual or other'
        }
      }
    }, // delete #postmigration

    // stores the currency that the transaction happened in (currency of the host)
    txnCurrency: {
      type: DataTypes.STRING,
      set: function(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('txnCurrency', val.toUpperCase());
        }
      }
    },

    // stores the foreign exchange rate at the time of transaction between donation currency and transaction currency
    // txnCurrencyFxRate = amount*100/amountInTxnCurrency
    // TODO: #postmigration update comment above to remove 100
    txnCurrencyFxRate: DataTypes.FLOAT,

    // amount in currency of the host
    amountInTxnCurrency: DataTypes.INTEGER,
    platformFeeInTxnCurrency: DataTypes.INTEGER,
    hostFeeInTxnCurrency: DataTypes.INTEGER,
    paymentProcessorFeeInTxnCurrency: DataTypes.INTEGER,
    netAmountInGroupCurrency: DataTypes.INTEGER, // stores the net amount received by the group
    stripeSubscriptionId: DataTypes.STRING, // delete #postmigration

    interval: {
      type: DataTypes.STRING
    }, // delete #postmigration

    data: DataTypes.JSON,

    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }, // delete #postmigration

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    },

    approvedAt: DataTypes.DATE, // delete #postmigration
    reimbursedAt: DataTypes.DATE // delete #postmigration
  }, {
    paranoid: true,

    classMethods: {
      createMany: (transactions, defaultValues) => {
        return Promise.map(transactions, transaction => {
          for (var attr in defaultValues) {
            transaction[attr] = defaultValues[attr];
          }
          return Transaction.create(transaction);
        }).catch(console.error);
      }
    },

    getterMethods: {

      preview() {
        if (!this.link) return {};

        if (this.link.match(/\.pdf$/)) {
          return {
            src: 'https://opencollective.com/static/images/mime-pdf.png',
            width: '100px'
          };
        } else {
          return {
            src: `https://res.cloudinary.com/opencollective/image/fetch/w_640/${this.link}`,
            width: '100%'
          };
        }
      },

      isRejected() {
        return !!this.approvedAt && !this.approved;
      },

      isDonation() {
        return (_.contains(this.tags, 'Donation') || _.contains(this.tags, 'Fund'));
      },

      isExpense() {
        return this.amount < 0;
      },

      isManual() {
        return this.payoutMethod === 'manual';
      },

      isReimbursed() {
        return !!this.reimbursedAt;
      },

      // Info.
      info() {
        return {
          id: this.id,
          type: this.type,
          description: this.description,
          amount: this.amount,
          vat: this.vat,
          currency: this.currency,
          vendor: this.vendor,
          paidby: this.paidby,
          tags: this.tags,
          status: this.status,
          comment: this.comment,
          link: this.link,
          approved: this.approved,
          createdAt: this.createdAt,
          approvedAt: this.approvedAt,
          reimbursedAt: this.reimbursedAt,
          UserId: this.UserId,
          GroupId: this.GroupId,
          payoutMethod: this.payoutMethod,
          isExpense: this.isExpense,
          isRejected: this.isRejected,
          isDonation: this.isDonation,
          isManual: this.isManual,
          isReimbursed: this.isReimbursed,
          interval: this.interval,
          platformFee: this.platformFee,
          hostFee: this.hostFee,
          paymentProcessorFee: this.paymentProcessorFee,
          netAmountInGroupCurrency: this.netAmountInGroupCurrency
        };
      }
    },

    classMethods: {

      createMany: (transactions, defaultValues) => {
        return Promise.map(transactions, transaction => {
          for (var attr in defaultValues) {
            transaction[attr] = defaultValues[attr];
          }
          return Transaction.create(transaction);
        }).catch(console.error);
      },

      createFromPayload({ transaction, user, group, subscription, paymentMethod }) {

        // attach other objects manually. Needed for afterCreate hook to work properly
        transaction.UserId = user && user.id;
        transaction.GroupId = group && group.id;
        transaction.PaymentMethodId = transaction.PaymentMethodId || (paymentMethod ? paymentMethod.id : null);
        transaction.SubscriptionId = subscription ? subscription.id : null;

        if (transaction.amount > 0 && transaction.txnCurrencyFxRate) {
          // populate netAmountInGroupCurrency for donations
            transaction.netAmountInGroupCurrency =
              Math.round((transaction.amountInTxnCurrency
                - transaction.platformFeeInTxnCurrency
                - transaction.hostFeeInTxnCurrency
                - transaction.paymentProcessorFeeInTxnCurrency)
              *transaction.txnCurrencyFxRate);
        } else {
          // populate netAmountInGroupCurrency for "Add Funds" and Expenses
          transaction.netAmountInGroupCurrency = transaction.amount*100;
        }
        return Transaction.create(transaction);
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
              transaction: transaction.get(),
              user: transaction.User && transaction.User.info,
              group: transaction.Group && transaction.Group.info
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
      afterCreate: (transaction) => {
        return Transaction.createActivity(transaction);
      }
    }
  });

  return Transaction;
};
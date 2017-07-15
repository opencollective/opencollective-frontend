import Promise from 'bluebird';
import activities from '../constants/activities';
import { type } from '../constants/transactions';

/*
 * Transaction model
 * - this indicates that money was moved in the system
 */
export default (Sequelize, DataTypes) => {

  const { models } = Sequelize;

  const Transaction = Sequelize.define('Transaction', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },
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
    // Note that the host can also change over time (that's why just keeping CollectiveId is not enough)
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

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    // stores the currency that the transaction happened in (currency of the host)
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
    netAmountInCollectiveCurrency: DataTypes.INTEGER, // stores the net amount received by the collective

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
        return this.amountInTxnCurrency - this.paymentProcessorFeeInTxnCurrency - this.platformFeeInTxnCurrency - this.hostFeeInTxnCurrency;
      },

      amountSentToHostInTxnCurrency() {
        return this.amountInTxnCurrency - this.paymentProcessorFeeInTxnCurrency - this.platformFeeInTxnCurrency;
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
          CollectiveId: this.CollectiveId,
          platformFee: this.platformFee,
          hostFee: this.hostFee,
          paymentProcessorFeeInTxnCurrency: this.paymentProcessorFeeInTxnCurrency,
          amountInTxnCurrency: this.amountInTxnCurrency,
          netAmountInCollectiveCurrency: this.netAmountInCollectiveCurrency,
          netAmountInTxnCurrency: this.netAmountInTxnCurrency,
          amountSentToHostInTxnCurrency: this.amountSentToHostInTxnCurrency,
          txnCurrency: this.txnCurrency
        };
      }
    },

    instanceMethods: {
      getUserForViewer(viewer, userid = this.UserId) {
        const promises = [models.User.findOne({where: { id: userid }})];
        if (viewer) {
          promises.push(viewer.canEditCollective(this.CollectiveId));
        }
        return Promise.all(promises)
        .then(results => {
          const user = results[0];
          if (!user) return {}; // need to return an object other it breaks when graphql tries user.name
          const canEditCollective = results[1];
          return canEditCollective ? user.info : user.public;
        })
      },
      getHostForViewer(viewer) {
        return this.getUserForViewer(viewer, this.HostId);
      },
      getExpenseForViewer(viewer) {
        const promises = [ models.Expense.findOne({where: { id: this.ExpenseId }}) ];
        if (viewer) {
          promises.push(viewer.canEditCollective(this.CollectiveId));
        }
        return Promise.all(promises)
        .then(results => {
          const expense = results[0];
          const canEditCollective = results[1];
          if (!expense) return null;
          if (viewer && canEditCollective) return expense.info;
          if (viewer && viewer.id === expense.UserId) return expense.info;
          return expense.public;
        })
      },
      getSource() {
        switch (this.type) {
          case 'EXPENSE':
            return this.getExpense();
          case 'DONATION':
            return this.getDonation();
        }        
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

      createFromPayload({ transaction, user, collective, paymentMethod }) {

        return collective.getHost().then(host => {
          if (!host) {
            throw new Error(`Cannot create a transaction: collective id ${collective.id} doesn't have a host`);
          }

          transaction.HostId = host.id;
          // attach other objects manually. Needed for afterCreate hook to work properly
          transaction.UserId = user && user.id;
          transaction.CollectiveId = collective && collective.id;
          transaction.PaymentMethodId = transaction.PaymentMethodId || (paymentMethod ? paymentMethod.id : null);
          transaction.type = (transaction.amount > 0) ? type.DONATION : type.EXPENSE;

          if (transaction.amount > 0 && transaction.txnCurrencyFxRate) {
            // populate netAmountInCollectiveCurrency for donations
            // @aseem: why the condition on && transaction.txnCurrencyFxRate ?
              transaction.netAmountInCollectiveCurrency =
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
            { model: models.Collective },
            { model: models.User },
            { model: models.PaymentMethod }
          ]
        })
        // Create activity.
        .then(transaction => {

          const activityPayload = {
            type: activities.GROUP_TRANSACTION_CREATED,
            TransactionId: transaction.id,
            CollectiveId: transaction.CollectiveId,
            UserId: transaction.UserId,
            data: {
              transaction: transaction.info,
              user: transaction.User && transaction.User.minimal,
              collective: transaction.Collective && transaction.Collective.minimal
            }
          };
          if (transaction.User) {
            activityPayload.data.user = transaction.User.info;
          }
          if (transaction.PaymentMethod) {
            activityPayload.data.paymentMethod = transaction.PaymentMethod.info;
          }
          return models.Activity.create(activityPayload);
        })
        .catch(err => console.error(`Error creating activity of type ${activities.GROUP_TRANSACTION_CREATED} for transaction ID ${transaction.id}`, err));
      }
    },

    hooks: {
      afterCreate: (transaction) => {
        Transaction.createActivity(transaction);
        // intentionally returns null, needs to be async (https://github.com/petkaantonov/bluebird/blob/master/docs/docs/warning-explanations.md#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it)
        return null;
      }
    }
  });

  return Transaction;
};

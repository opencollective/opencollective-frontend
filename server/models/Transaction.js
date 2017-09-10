import Promise from 'bluebird';
import activities from '../constants/activities';
import { type } from '../constants/transactions';
import CustomDataTypes from './DataTypes';
import debugLib from 'debug';
const debug = debugLib("transaction");

/*
 * Transaction model
 * - this indicates that money was moved in the system
 */
export default (Sequelize, DataTypes) => {

  const { models } = Sequelize;

  const Transaction = Sequelize.define('Transaction', {

    type: DataTypes.STRING, // EXPENSE or DONATION

    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },

    description: DataTypes.STRING,
    amount: DataTypes.INTEGER,

    currency: CustomDataTypes(DataTypes).currency,

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    FromCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    ToCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    // Keeps a reference to the host because this is where the bank account is
    // Note that the host can also change over time (that's why just keeping CollectiveId is not enough)
    HostCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    OrderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Orders',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
    },

    // Refactor: an Expense should be an Order
    ExpenseId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Expenses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true
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
          CreatedByUserId: this.CreatedByUserId,
          FromCollectiveId: this.FromCollectiveId,
          ToCollectiveId: this.ToCollectiveId,
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

    hooks: {
      afterCreate: (transaction) => {
        Transaction.createActivity(transaction);
        // intentionally returns null, needs to be async (https://github.com/petkaantonov/bluebird/blob/master/docs/docs/warning-explanations.md#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it)
        return null;
      }
    }
  });

  /**
   * Instance Methods
   */
  Transaction.prototype.getUser = function() {
    return models.User.findById(this.CreatedByUserId);
  };

  Transaction.prototype.getHostCollective = function() {
    return models.Collective.findById(this.HostCollectiveId);
  };

  Transaction.prototype.getExpenseForViewer = function(viewer) {
    return models.Expense.findOne({ where: { id: this.ExpenseId } })
      .then(expense => {
        if (!expense) return null;
        if (viewer && viewer.isAdmin(this.ToCollectiveId)) return expense.info;
        if (viewer && viewer.id === expense.UserId) return expense.info;
        return expense.public;
      });
  };

  Transaction.prototype.getSource = function() {
    switch (this.type) {
      case 'EXPENSE':
        return this.getExpense();
      case 'DONATION':
        return this.getOrder();
    }        
  };

  /**
   * Class Methods
   */
  Transaction.createMany = (transactions, defaultValues) => {
    return Promise.map(transactions, transaction => {
      for (const attr in defaultValues) {
        transaction[attr] = defaultValues[attr];
      }
      return Transaction.create(transaction);
    }).catch(console.error);
  };

  /**
   * Create the opposite transaction from the perspective of the FromCollective
   * There is no fees
   * @POST Two transactions are created. Returns the initial transaction FromCollectiveId -> ToCollectiveId
   */
  Transaction.createDoubleEntry = (transaction) => {
    const oppositeTransaction = {
      ...transaction,
      type: (-transaction.amount > 0) ? type.DONATION : type.EXPENSE,
      FromCollectiveId: transaction.ToCollectiveId,
      ToCollectiveId: transaction.FromCollectiveId,
      amount: -transaction.amount,
      netAmountInCollectiveCurrency: -transaction.amount,
      paymentProcessorFeeInTxnCurrency: 0,
      platformFeeInTxnCurrency: 0,
      hostFeeInTxnCurrency: 0
    }

    debug("createDoubleEntry", transaction, "opposite", oppositeTransaction);
    
    // We first record the negative transaction 
    // and only then we can create the transaction to add money somewhere else
    const transactions = [];
    let index = 0;
    if (transaction.amount < 0) {
      index = 0;
      transactions.push(transaction);
      transactions.push(oppositeTransaction);
    } else {
      index = 1;
      transactions.push(oppositeTransaction);
      transactions.push(transaction);
    }
    return Promise.each(transactions, t => Transaction.create(t)).then(transactions => transactions[index]);
  };

  Transaction.createFromPayload = ({ CreatedByUserId, FromCollectiveId, ToCollectiveId, transaction, paymentMethod }) => {

    if (!transaction.amount) {
      return Promise.reject(new Error("transaction.amount cannot be null or zero"));
    }

    return models.Member.findOne({ where: { role: 'HOST', CollectiveId: ToCollectiveId } }).then(member => {
      if (!member) {
        throw new Error(`Cannot create a transaction: collective id ${ToCollectiveId} doesn't have a host`);
      }

      transaction.HostCollectiveId = member.MemberCollectiveId;
      // attach other objects manually. Needed for afterCreate hook to work properly
      transaction.CreatedByUserId = CreatedByUserId;
      transaction.FromCollectiveId = FromCollectiveId;
      transaction.ToCollectiveId = ToCollectiveId;
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
            * transaction.txnCurrencyFxRate);
      }
      return Transaction.createDoubleEntry(transaction);
    });
  };

  Transaction.createActivity = (transaction) => {
    if (transaction.deletedAt) {
      return Promise.resolve();
    }
    return Transaction.findById(transaction.id, {
      include: [
        { model: models.Collective, as: 'fromCollective' },
        { model: models.Collective, as: 'toCollective' },
        { model: models.User, as: 'createdByUser' },
        { model: models.PaymentMethod }
      ]
    })
    // Create activity.
    .then(transaction => {

      const activityPayload = {
        type: activities.COLLECTIVE_TRANSACTION_CREATED,
        TransactionId: transaction.id,
        CollectiveId: transaction.CollectiveId,
        CreatedByUserId: transaction.CreatedByUserId,
        data: {
          transaction: transaction.info,
          user: transaction.User && transaction.User.minimal,
          collective: transaction.toCollective && transaction.toCollective.minimal
        }
      };
      if (transaction.createdByUser) {
        activityPayload.data.user = transaction.createdByUser.info;
      }
      if (transaction.PaymentMethod) {
        activityPayload.data.paymentMethod = transaction.PaymentMethod.info;
      }
      return models.Activity.create(activityPayload);
    })
    .catch(err => console.error(`Error creating activity of type ${activities.COLLECTIVE_TRANSACTION_CREATED} for transaction ID ${transaction.id}`, err));
  };

  return Transaction;
};

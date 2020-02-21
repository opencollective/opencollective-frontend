import { get, pick } from 'lodash';
import Temporal from 'sequelize-temporal';
import { TransactionTypes } from '../constants/transactions';
import activities from '../constants/activities';
import status from '../constants/expense_status';
import expenseType from '../constants/expense_type';
import CustomDataTypes from '../models/DataTypes';
import { reduceArrayToCurrency } from '../lib/currency';
import models, { Op } from './';
import { PayoutMethodTypes } from './PayoutMethod';

export default function(Sequelize, DataTypes) {
  const Expense = Sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'Collectives' },
        onDelete: 'SET NULL', // Collective deletion will fail if it has expenses
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      currency: CustomDataTypes(DataTypes).currency,

      amount: {
        type: DataTypes.INTEGER,
        validate: { min: 1 },
        allowNull: false,
      },

      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      /**
       * @deprecated Now using PaymentMethodId. The reason why this hadn't been removed yet
       * is because we'd need to migrate the legacy `donation` payout types that exist in the
       * DB and that `PayoutMethod` has no equivalent for.
       */
      legacyPayoutMethod: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            // donation is deprecated but we keep it in the model because of existing entries
            args: [['paypal', 'manual', 'donation', 'other']],
            msg: 'Must be paypal or other. Deprecated: donation and manual.',
          },
        },
        allowNull: false,
        defaultValue: 'manual',
      },

      PayoutMethodId: {
        type: DataTypes.INTEGER,
        references: { key: 'id', model: 'PayoutMethods' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },

      privateMessage: DataTypes.STRING,
      invoiceInfo: DataTypes.TEXT,
      category: DataTypes.STRING,
      vat: DataTypes.INTEGER,

      lastEditedById: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: status.PENDING,
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.keys(status)],
            msg: `Must be in ${Object.keys(status)}`,
          },
        },
      },

      type: {
        type: DataTypes.ENUM(Object.keys(expenseType)),
        defaultValue: expenseType.UNCLASSIFIED,
      },

      incurredAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        info() {
          return {
            type: TransactionTypes.DEBIT,
            id: this.id,
            UserId: this.UserId,
            CollectiveId: this.CollectiveId,
            FromCollectiveId: this.FromCollectiveId,
            currency: this.currency,
            amount: this.amount,
            description: this.description,
            category: this.category,
            legacyPayoutMethod: this.legacyPayoutMethod,
            vat: this.vat,
            privateMessage: this.privateMessage,
            lastEditedById: this.lastEditedById,
            status: this.status,
            incurredAt: this.incurredAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },
        public() {
          return {
            type: TransactionTypes.DEBIT,
            id: this.id,
            UserId: this.UserId,
            CollectiveId: this.CollectiveId,
            FromCollectiveId: this.FromCollectiveId,
            currency: this.currency,
            amount: this.amount,
            description: this.description,
            category: this.category,
            legacyPayoutMethod: this.legacyPayoutMethod,
            vat: this.vat,
            lastEditedById: this.lastEditedById,
            status: this.status,
            incurredAt: this.incurredAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        },
      },
      hooks: {
        afterUpdate(expense) {
          switch (expense.status) {
            case status.APPROVED:
              return expense.createActivity(activities.COLLECTIVE_EXPENSE_APPROVED);
          }
        },
        afterDestroy(expense) {
          return models.ExpenseAttachment.destroy({ where: { ExpenseId: expense.id } });
        },
      },
    },
  );

  /**
   * Instance Methods
   */
  Expense.prototype.createActivity = async function(type) {
    const user = this.user || (await models.User.findByPk(this.UserId));
    const userCollective = await models.Collective.findByPk(user.CollectiveId);
    if (!this.collective) {
      this.collective = await this.getCollective();
    }
    const host = await this.collective.getHostCollective(); // may be null
    const payoutMethod = await this.getPayoutMethod();
    const transaction =
      this.status === status.PAID &&
      (await models.Transaction.findOne({
        where: { type: 'DEBIT', ExpenseId: this.id },
      }));
    await models.Activity.create({
      type,
      UserId: this.UserId,
      CollectiveId: this.collective.id,
      data: {
        host: get(host, 'minimal'),
        collective: { ...this.collective.minimal, isActive: this.collective.isActive },
        user: user.minimal,
        fromCollective: userCollective.minimal,
        expense: this.info,
        transaction: transaction.info,
        payoutMethod: payoutMethod && pick(payoutMethod.dataValues, ['id', 'type', 'data']),
      },
    });
  };

  Expense.schema('public');

  Expense.prototype.setApproved = function(lastEditedById) {
    if (this.status === status.PAID) {
      throw new Error("Can't approve an expense that is PAID");
    }
    this.status = status.APPROVED;
    this.lastEditedById = lastEditedById;
    return this.save();
  };

  Expense.prototype.setRejected = function(lastEditedById) {
    if (this.status === status.PAID) {
      throw new Error("Can't reject an expense that is PAID");
    }
    this.status = status.REJECTED;
    this.lastEditedById = lastEditedById;
    return this.save();
  };

  Expense.prototype.setPaid = function(lastEditedById) {
    this.status = status.PAID;
    this.lastEditedById = lastEditedById;
    return this.save();
  };

  Expense.prototype.setProcessing = function(lastEditedById) {
    this.status = status.PROCESSING;
    this.lastEditedById = lastEditedById;
    return this.save();
  };

  Expense.prototype.setError = function(lastEditedById) {
    this.status = status.ERROR;
    this.lastEditedById = lastEditedById;
    return this.save();
  };

  /**
   * Returns the PayoutMethod.type based on the legacy `payoutMethod`
   */
  Expense.prototype.getPayoutMethodTypeFromLegacy = function() {
    return Expense.getPayoutMethodTypeFromLegacy(this.legacyPayoutMethod);
  };

  /**
   * Get the total amount of all expenses filed by the given UserId
   * Converts the amount to baseCurrency if needed
   * @return amount in base currency (int)
   * @param {*} userId
   * @param {*} baseCurrency
   * @param {*} since
   * @param {*} until
   */
  Expense.getTotalExpensesFromUserIdInBaseCurrency = async function(userId, baseCurrency, since, until = new Date()) {
    const userExpenses = await Expense.findAll({
      attributes: ['currency', 'amount', 'status', 'updatedAt'],
      where: {
        UserId: userId,
        createdAt: {
          [Op.between]: [since, until], // between means since >= x <= until
        },
      },
    });
    const arr = [];
    for (const expense of userExpenses) {
      const entry = {
        currency: expense.currency,
        amount: expense.amount,
      };
      if (expense.status === status.PAID) {
        entry.date = expense.updatedAt;
      }

      if (expense.status !== status.REJECTED) {
        arr.push(entry);
      }
    }
    return reduceArrayToCurrency(arr, baseCurrency);
  };

  /**
   * Returns the legacy `payoutMethod` based on the new `PayoutMethod` type
   */
  Expense.getLegacyPayoutMethodTypeFromPayoutMethod = function(payoutMethod) {
    if (payoutMethod && payoutMethod.type === PayoutMethodTypes.PAYPAL) {
      return 'paypal';
    } else {
      return 'other';
    }
  };

  /**
   * Returns the PayoutMethod.type based on the legacy `payoutMethod`
   */
  Expense.getPayoutMethodTypeFromLegacy = function(legacyPayoutMethod) {
    return legacyPayoutMethod === 'paypal' ? PayoutMethodTypes.PAYPAL : PayoutMethodTypes.OTHER;
  };

  Temporal(Expense, Sequelize);

  return Expense;
}

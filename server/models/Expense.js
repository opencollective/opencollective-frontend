import { get, set } from 'lodash';
import Historical from 'sequelize-historical';
import { TransactionTypes } from '../constants/transactions';
import activities from '../constants/activities';
import status from '../constants/expense_status';
import expenseType from '../constants/expense_type';
import CustomDataTypes from '../models/DataTypes';
import { reduceArrayToCurrency } from '../lib/currency';
import models, { Op } from './';

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

      payoutMethod: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [['paypal', 'manual', 'donation', 'other']],
            msg: 'Must be paypal, manual, donation or other',
          },
        },
        allowNull: false,
        defaultValue: 'manual',
      },

      privateMessage: DataTypes.STRING,
      attachment: DataTypes.STRING,
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
            currency: this.currency,
            amount: this.amount,
            description: this.description,
            attachment: this.attachment,
            category: this.category,
            payoutMethod: this.payoutMethod,
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
            currency: this.currency,
            amount: this.amount,
            description: this.description,
            category: this.category,
            payoutMethod: this.payoutMethod,
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
            case status.PAID:
              expense._previousDataValues.status === status.APPROVED && expense.addUserIdToHostW9ReceivedList();
              break;
            case status.APPROVED:
              expense.createActivity(activities.COLLECTIVE_EXPENSE_APPROVED);
              break;
          }
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
      },
    });
  };

  Expense.prototype.addUserIdToHostW9ReceivedList = async function() {
    const host = await this.collective.getHostCollective();
    // If user is already included in Host data List, don't do anything
    if (get(host, 'data.W9.receivedFromUserIds') && host.data.W9.receivedFromUserIds.includes(this.UserId)) {
      return false;
    }
    // Only Inserts User in W9 Received list if he is already present on
    // the W9.requestSentToUserIds (which means this user already overstepped the W9 Threshold)
    if (get(host, 'data.W9.requestSentToUserIds') && host.data.W9.requestSentToUserIds.includes(this.UserId)) {
      const receivedFromUserIds = get(host, 'data.W9.receivedFromUserIds', []);
      receivedFromUserIds.push(this.UserId);
      set(host, 'data.W9.receivedFromUserIds', receivedFromUserIds);
      return host.update({ data: host.data });
    }
    return false;
  };

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

  Expense.prototype.getPaypalEmail = function() {
    return this.getUser().then(user => user.paypalEmail || user.email);
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

  Historical(Expense, Sequelize);

  return Expense;
}

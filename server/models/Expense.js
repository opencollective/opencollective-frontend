// const Temporal = require('sequelize-temporal');

const status = require('../constants/expense_status');

module.exports = function (Sequelize, DataTypes) {

  const Expense = Sequelize.define('Expense', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    UserId: {
      type: DataTypes.INTEGER,
      references: 'Users',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    GroupId: {
      type: DataTypes.INTEGER,
      references: 'Groups',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    amount: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    attachment: DataTypes.STRING,
    category: DataTypes.STRING,
    vat: DataTypes.INTEGER,

    lastEditedById: {
      type: DataTypes.INTEGER,
      references: 'Users',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: status.PENDING,
      validate: {
        isIn: {
          args: [[status.PENDING, status.APPROVED, status.REJECTED, status.PAID]],
          msg: 'Must be PENDING, APPROVED, REJECTED or PAID'
        }
      }
    },

    incurredAt: DataTypes.DATE, // date when the expense was incurred

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    deletedAt: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {

      isRejected() {
        return this.status === status.REJECTED;
      },

      isApproved() {
        return this.status === status.APPROVED;
      },

      isPaid() {
        return this.status === status.PAID;
      },

      isPending() {
        return this.status === status.PENDING;
      },

      info() {
        return {
          id: this.id,
          UserId: this.UserId,
          GroupId: this.GroupId,
          currency: this.currency,
          amount: this.amount,
          title: this.title,
          description: this.description,
          attachment: this.attachment,
          category: this.category,
          vat: this.vat,
          lastEditedById: this.lastEditedById,
          status: this.status,
          isPending: this.isPending,
          isRejected: this.isRejected,
          isApproved: this.isApproved,
          isPaid: this.isPaid,
          incurredAt: this.incurredAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    },

    instanceMethods: {
      reject() {
        this.status = status.REJECTED;
        return this.save();
      },

      approve() {
        this.status = status.APPROVED;
        return this.save();
      }
    }
  });

  return Expense;
  // TODO: enable Temporal
  // return Temporal(Expense, Sequelize);
};

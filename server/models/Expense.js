const status = require('../constants/expense_status');
const allowedCurrencies = Object.keys(require('../constants/currencies'));

module.exports = function (Sequelize, DataTypes) {

  return Sequelize.define('Expense', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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

    currency: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [allowedCurrencies],
          msg: `Must be in ${allowedCurrencies}`
        }
      },
      allowNull: false
    },

    amount: {
      type: DataTypes.INTEGER,
      validate: { min: 0 },
      allowNull: false
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    notes: DataTypes.TEXT,
    attachment: DataTypes.STRING,
    category: DataTypes.STRING,
    vat: DataTypes.INTEGER,

    lastEditedById: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: status.PENDING,
      allowNull: false,
      validate: {
        isIn: {
          args: [[status.PENDING, status.APPROVED, status.REJECTED, status.PAID]],
          msg: 'Must be PENDING, APPROVED, REJECTED or PAID'
        }
      }
    },

    // date when the expense was incurred
    incurredAt: {
      type: DataTypes.DATE,
      allowNull: false
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    },

    deletedAt: {
      type: DataTypes.DATE
    }
  }, {
    paranoid: true,

    getterMethods: {
      info() {
        return {
          id: this.id,
          UserId: this.UserId,
          GroupId: this.GroupId,
          currency: this.currency,
          amount: this.amount,
          title: this.title,
          attachment: this.attachment,
          category: this.category,
          vat: this.vat,
          lastEditedById: this.lastEditedById,
          status: this.status,
          incurredAt: this.incurredAt,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    },

    instanceMethods: {
      setApproved() {
        this.status = status.APPROVED;
        return this.save();
      },

      setRejected() {
        this.status = status.REJECTED;
        return this.save();
      },

      setPaid() {
        this.status = status.PAID;
        return this.save();
      }
    }
  });
};

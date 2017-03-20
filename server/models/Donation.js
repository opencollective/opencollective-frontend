import { type } from '../constants/transactions';

const donationType = type.DONATION;

export default function(Sequelize, DataTypes) {

  const Donation = Sequelize.define('Donation', {
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
      onUpdate: 'CASCADE'
    },

    GroupId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Groups',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    // 3 letter international code (in uppercase) of the currency (e.g. USD, EUR, MXN, GBP, ...)
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      set(val) {
        if (val && val.toUpperCase) {
          this.setDataValue('currency', val.toUpperCase());
        }
      }
    },

    amount: {
      type: DataTypes.INTEGER, // In cents
      min: 0
    },

    title: DataTypes.STRING,

    notes: DataTypes.TEXT,

    SubscriptionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Subscriptions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    PaymentMethodId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'PaymentMethods',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    ResponseId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Responses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    isProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    processedAt: DataTypes.DATE,

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
      info() {
        return {
          type: donationType,
          id: this.id,
          UserId: this.UserId,
          GroupId: this.GroupId,
          currency: this.currency,
          amount: this.amount,
          title: this.title,
          SubscriptionId: this.SubscriptionId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    }
  });

  return Donation;
}

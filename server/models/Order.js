import { type } from '../constants/transactions';

export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Order = Sequelize.define('Order', {
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

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    TierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tiers',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },

    quantity: {
      type: DataTypes.INTEGER,
      min: 0
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
      type: DataTypes.INTEGER // Total amount of the order in cents
    },

    description: DataTypes.STRING,

    publicMessage: DataTypes.STRING,
    privateMessage: DataTypes.STRING,

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
      }
    },
    getterMethods: {

      // total amount over time of this order
      totalAmount() {
        if (!this.SubscriptionId) return this.amount;
        return models.Transaction.sum('amount', {
          where: {
            OrderId: this.id,
            type: type.DONATION
          }
        })
      },
      info() {
        return {
          type: type.DONATION,
          id: this.id,
          UserId: this.UserId,
          TierId: this.TierId,
          CollectiveId: this.CollectiveId,
          currency: this.currency,
          amount: this.amount,
          description: this.description,
          privateMessage: this.privateMessage,
          publicMessage: this.publicMessage,
          SubscriptionId: this.SubscriptionId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    }
  });

  return Order;
}

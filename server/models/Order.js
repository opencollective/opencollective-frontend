import { type } from '../constants/transactions';
import Promise from 'bluebird';

export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Order = Sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    FromCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    ToCollectiveId: {
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

    totalAmount: {
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

    getterMethods: {

      // total Transactions over time for this order
      totalTransactions() {
        if (!this.SubscriptionId) return this.totalAmount;
        return models.Transaction.sum('amount', {
          where: {
            OrderId: this.id,
            type: type.DONATION
          }
        })
      },
      
      // does this payment method support recurring payments?
      recurring() {
        return (this.service === 'stripe');
      },

      info() {
        return {
          type: type.DONATION,
          id: this.id,
          CreatedByUserId: this.CreatedByUserId,
          TierId: this.TierId,
          FromCollectiveId: this.FromCollectiveId,
          ToCollectiveId: this.ToCollectiveId,
          currency: this.currency,
          totalAmount: this.totalAmount,
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

  /**
   * Instance Methods
   */

  /**
   * Populate all the foreign keys if necessary
   * (order.fromCollective, order.toCollective, order.createdByUser, order.tier)
   * @param {*} order 
   */
  Order.prototype.populate = function(foreignKeys = ['FromCollectiveId', 'ToCollectiveId', 'CreatedByUserId', 'TierId']) {
    return Promise.map(foreignKeys, fk => {
      const attribute = (fk.substr(0,1).toLowerCase() + fk.substr(1)).replace(/Id$/, '');
      const model = fk.replace(/(from|to|createdby)/i, '').replace(/Id$/,'');
      const promise = () => {
        if (this[attribute]) return Promise.resolve(this[attribute]);
        if (!this[fk]) return Promise.resolve(null);
        return models[model].findById(this[fk]);
      }
      return promise().then(obj => {
        this[attribute] = obj;
      })
    })
    .then(() => this);
  }   
  return Order;
}

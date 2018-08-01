import { TransactionTypes } from '../constants/transactions';
import Promise from 'bluebird';
import CustomDataTypes from './DataTypes';
import Temporal from 'sequelize-temporal';

import debugLib from 'debug';
const debug = debugLib('order');

import status from '../constants/order_status';

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

    // User|Organization|Collective that is author of this Order
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

    currency: CustomDataTypes(DataTypes).currency,

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

    MatchingPaymentMethodId: {
      type: DataTypes.INTEGER,
      references: { model: 'PaymentMethods', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true,
      description: "References the PaymentMethod used to match"
    },

    ReferralCollectiveId: {
      type: DataTypes.INTEGER,
      references: { model: 'Collectives', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true,
      description: "Referral"
    },

    processedAt: DataTypes.DATE,

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

      // does this payment method support recurring payments?
      recurring() {
        return (this.service === 'stripe');
      },

      info() {
        return {
          type: TransactionTypes.CREDIT,
          id: this.id,
          CreatedByUserId: this.CreatedByUserId,
          TierId: this.TierId,
          FromCollectiveId: this.FromCollectiveId,
          CollectiveId: this.CollectiveId,
          currency: this.currency,
          quantity: this.quantity,
          totalAmount: this.totalAmount,
          description: this.description,
          privateMessage: this.privateMessage,
          publicMessage: this.publicMessage,
          SubscriptionId: this.SubscriptionId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      },

      activity() {
        return {
          id: this.id,
          totalAmount: this.totalAmount,
          currency: this.currency,
          description: this.description,
          publicMessage: this.publicMessage
        }
      }
    }
  });

  /**
   * Instance Methods
   */

  // total Transactions over time for this order
  Order.prototype.getTotalTransactions = function() {
    if (!this.SubscriptionId) return this.totalAmount;
    return models.Transaction.sum('amount', {
      where: {
        OrderId: this.id,
        type: TransactionTypes.CREDIT
      }
    });
  }

  Order.prototype.setPaymentMethod = function(paymentMethodData) {
    debug("setPaymentMethod", paymentMethodData);
    return this.getUser()
      .then(user => models.PaymentMethod.getOrCreate(user, paymentMethodData))
      .then(pm => this.validatePaymentMethod(pm))
      .then(pm => {
        this.paymentMethod = pm;
        this.PaymentMethodId = pm.id;
        return this.save();
      })
      .then(() => this);
  };

  /**
   * Validates the payment method for the current order
   * Makes sure that the user can use this payment method for such order
   */
  Order.prototype.validatePaymentMethod = function(paymentMethod) {
    debug("validatePaymentMethod", paymentMethod.dataValues, "this.user", this.CreatedByUserId);
    return paymentMethod.canBeUsedForOrder(this, this.createdByUser).then(canBeUsedForOrder => {
      if (canBeUsedForOrder) return paymentMethod;
      else return null;
    });
  };

  Order.prototype.getUser = function() {
    if (this.createdByUser) return Promise.resolve(this.createdByUser);
    return models.User.findById(this.CreatedByUserId).then(user => {
      this.createdByUser = user;
      debug("getUser", user.dataValues);
      return user.populateRoles();
    });
  };

  /**
   * Populate all the foreign keys if necessary
   * (order.fromCollective, order.collective, order.createdByUser, order.tier)
   * @param {*} order
   */
  Order.prototype.populate = function(foreignKeys = ['FromCollectiveId', 'CollectiveId', 'CreatedByUserId', 'TierId', 'PaymentMethodId']) {
    return Promise.map(foreignKeys, fk => {
      const attribute = (fk.substr(0,1).toLowerCase() + fk.substr(1)).replace(/Id$/, '');
      const model = fk.replace(/(from|to|createdby)/i, '').replace(/Id$/,'');
      const promise = () => {
        if (this[attribute]) return Promise.resolve(this[attribute]);
        if (!this[fk]) return Promise.resolve(null);
        return models[model].findById(this[fk]);
      };
      return promise().then(obj => {
        this[attribute] = obj;
      });
    })
    .then(() => this);
  };

  Order.prototype.getPaymentMethodForUser = function(user) {
    return user.populateRoles()
      .then(() => {
        // this check is necessary to cover organizations as well as user collective
        if (user.isAdmin(this.FromCollectiveId)) {
          return models.PaymentMethod.findById(this.PaymentMethodId);
        } else {
          return null;
        }
      });
  };

  Order.prototype.getSubscriptionForUser = function(user) {
    if (!this.SubscriptionId) {
      return null;
    }
    return user.populateRoles()
      .then(() => {
        // this check is necessary to cover organizations as well as user collective
        if (user.isAdmin(this.FromCollectiveId)) {
          return this.getSubscription();
        } else {
          return null;
        }
      });
  };

  Temporal(Order, Sequelize);
  return Order;
}

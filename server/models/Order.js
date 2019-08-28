import { TransactionTypes } from '../constants/transactions';
import Promise from 'bluebird';
import CustomDataTypes from './DataTypes';
import Historical from 'sequelize-historical';
import { get } from 'lodash';

import debugLib from 'debug';
const debug = debugLib('order');

import status from '../constants/order_status';

export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const Order = Sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      // User|Organization|Collective that is author of this Order
      FromCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
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

      TierId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tiers',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      quantity: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
        },
      },

      currency: CustomDataTypes(DataTypes).currency,

      totalAmount: {
        type: DataTypes.INTEGER, // Total amount of the order in cents
        validate: {
          min: 0,
        },
      },

      taxAmount: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      description: DataTypes.STRING,

      publicMessage: {
        type: DataTypes.STRING,
      },

      privateMessage: DataTypes.STRING,

      SubscriptionId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Subscriptions',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      PaymentMethodId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'PaymentMethods',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      ReferralCollectiveId: {
        type: DataTypes.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description: 'Referral',
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

      interval: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true,

      getterMethods: {
        // does this payment method support recurring payments?
        recurring() {
          return this.service === 'stripe';
        },

        info() {
          return {
            id: this.id,
            type: get(this, 'collective.type') === 'EVENT' ? 'registration' : 'donation',
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
            updatedAt: this.updatedAt,
          };
        },

        activity() {
          return {
            id: this.id,
            totalAmount: this.totalAmount,
            currency: this.currency,
            description: this.description,
            publicMessage: this.publicMessage,
          };
        },
      },
    },
  );

  /**
   * Instance Methods
   */

  // total Transactions over time for this order
  Order.prototype.getTotalTransactions = function() {
    if (!this.SubscriptionId) return this.totalAmount;
    return models.Transaction.sum('amount', {
      where: {
        OrderId: this.id,
        type: TransactionTypes.CREDIT,
      },
    });
  };

  /**
   * This will either create a new payment method or fetch an existing one
   * in which case, this will also make sure that the user can actually use it
   * (need to be a member of admin of the collective if there is a monthlyLimitPerUser or an admin if no limit)
   */
  Order.prototype.setPaymentMethod = function(paymentMethodData) {
    debug('setPaymentMethod', paymentMethodData);
    return this.getUser() // remote user (logged in user) that created the order
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
    debug('validatePaymentMethod', paymentMethod.dataValues, 'this.user', this.CreatedByUserId);
    return paymentMethod.canBeUsedForOrder(this, this.createdByUser).then(canBeUsedForOrder => {
      if (canBeUsedForOrder) return paymentMethod;
      else return null;
    });
  };

  Order.prototype.getUser = function() {
    if (this.createdByUser) return Promise.resolve(this.createdByUser);
    return models.User.findByPk(this.CreatedByUserId).then(user => {
      this.createdByUser = user;
      debug('getUser', user.dataValues);
      return user.populateRoles();
    });
  };

  /**
   * Populate all the foreign keys if necessary
   * (order.fromCollective, order.collective, order.createdByUser, order.tier)
   * @param {*} order
   */
  Order.prototype.populate = function(
    foreignKeys = ['FromCollectiveId', 'CollectiveId', 'CreatedByUserId', 'TierId', 'PaymentMethodId'],
  ) {
    return Promise.map(foreignKeys, fk => {
      const attribute = (fk.substr(0, 1).toLowerCase() + fk.substr(1)).replace(/Id$/, '');
      const model = fk.replace(/(from|to|createdby)/i, '').replace(/Id$/, '');
      const promise = () => {
        if (this[attribute]) return Promise.resolve(this[attribute]);
        if (!this[fk]) return Promise.resolve(null);
        return models[model].findByPk(this[fk]);
      };
      return promise().then(obj => {
        this[attribute] = obj;
      });
    }).then(() => this);
  };

  Order.prototype.getPaymentMethodForUser = function(user) {
    return user.populateRoles().then(() => {
      // this check is necessary to cover organizations as well as user collective
      if (user.isAdmin(this.FromCollectiveId)) {
        return models.PaymentMethod.findByPk(this.PaymentMethodId);
      } else {
        return null;
      }
    });
  };

  Order.prototype.getSubscriptionForUser = function(user) {
    if (!this.SubscriptionId) {
      return null;
    }
    return user.populateRoles().then(() => {
      // this check is necessary to cover organizations as well as user collective
      if (user.isAdmin(this.FromCollectiveId)) {
        return this.getSubscription();
      } else {
        return null;
      }
    });
  };

  Historical(Order, Sequelize);

  return Order;
}

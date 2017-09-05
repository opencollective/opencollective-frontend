import { type } from '../constants/transactions';
import Promise from 'bluebird';
import CustomDataTypes from './DataTypes';
import { formatCurrency } from '../lib/utils';
import { getFxRate } from '../lib/currency';

import debugLib from 'debug';
const debug = debugLib('order');

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
  }

  /**
   * Validates the payment method for the current order
   * Makes sure that the user can use this payment method for such order
   */
  Order.prototype.validatePaymentMethod = function(paymentMethod) {
    debug("validatePaymentMethod", paymentMethod.dataValues, "this.user", this.CreatedByUserId);
    // If the payment method doesn't belong to the user, it can only be used to execute orders on behalf of the collective it is associated with
    if (paymentMethod.CreatedByUserId !== this.CreatedByUserId && paymentMethod.CollectiveId !== this.FromCollectiveId) {
      throw new Error(`This payment method can only be used to create orders on behalf of the collective id ${paymentMethod.CollectiveId}`);
    }

    if (this.interval && !paymentMethod.features.recurring) {
      throw new Error("This payment method doesn't support recurring payments");
    }

    // We get an estimate of the total amount of the order in the currency of the payment method
    return getFxRate(this.currency, paymentMethod.currency)
      .then(fxrate => {
        const totalAmountInPaymentMethodCurrency = this.totalAmount * fxrate;
        let orderAmountInfo = formatCurrency(this.totalAmount, this.currency);
        if (this.currency !== paymentMethod.currency) {
          orderAmountInfo += ` ~= ${formatCurrency(totalAmountInPaymentMethodCurrency, paymentMethod.currency)}`;
        }
        if (paymentMethod.monthlyLimitPerMember && totalAmountInPaymentMethodCurrency > paymentMethod.monthlyLimitPerMember) {
          throw new Error(`The total amount of this order (${orderAmountInfo}) is higher than your monthly spending limit on this payment method (${formatCurrency(paymentMethod.monthlyLimitPerMember, paymentMethod.currency)})`);
        }
        return paymentMethod.getBalanceForUser(this.createdByUser, paymentMethod)
          .then(balance => {
            if (balance && totalAmountInPaymentMethodCurrency > balance.amount) {
              throw new Error(`You don't have enough funds available (${formatCurrency(balance.amount, balance.currency)} left) to execute this order (${orderAmountInfo})`)
            }
            return paymentMethod;
          })
        });
  }

  Order.prototype.getUser = function() {
    if (this.createdByUser) return Promise.resolve(this.createdByUser);
    return models.User.findById(this.CreatedByUserId).then(user => {
      this.createdByUser = user
      return user.populateRoles();
    });
  }

  /**
   * Populate all the foreign keys if necessary
   * (order.fromCollective, order.toCollective, order.createdByUser, order.tier)
   * @param {*} order 
   */
  Order.prototype.populate = function(foreignKeys = ['FromCollectiveId', 'ToCollectiveId', 'CreatedByUserId', 'TierId', 'PaymentMethodId']) {
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

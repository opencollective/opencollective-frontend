/** @module models/PaymentMethod */

import libdebug from 'debug';
import { get, intersection } from 'lodash';

import { TransactionTypes } from '../constants/transactions';

import { sumTransactions } from '../lib/hostlib';
import { formatCurrency } from '../lib/utils';
import { getFxRate } from '../lib/currency';

import CustomDataTypes from './DataTypes';
import * as stripe from '../paymentProviders/stripe/gateway';
import * as libpayments from '../lib/payments';

const debug = libdebug('PaymentMethod');


export default function(Sequelize, DataTypes) {

  const { models, Op } = Sequelize;

  const payoutMethods = ['paypal', 'stripe', 'opencollective', 'prepaid'];

  const PaymentMethod = Sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
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

    /**
     * Can be NULL when the user doesn't want to remember the payment method information (e.g. credit card info)
     * In that case we still need to store it for archive reasons (we want to be able to print the invoice and show the payment method that has been used)
     * But in the case, we don't link the payment method to the User/Org CollectiveId.
     */
    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    name: DataTypes.STRING, // custom human readable identifier for the payment method
    description: DataTypes.STRING, // custom human readable description (useful for matching fund)
    customerId: DataTypes.STRING, // stores the id of the customer from the payment processor at the platform level
    token: DataTypes.STRING,
    primary: DataTypes.BOOLEAN,

    // Monthly limit in cents for each member of this.CollectiveId (in the currency of that collective)
    monthlyLimitPerMember: {
      type: DataTypes.INTEGER
    },

    currency: CustomDataTypes(DataTypes).currency,

    service: {
      type: DataTypes.STRING,
      defaultValue: 'stripe',
      validate: {
        isIn: {
          args: [payoutMethods],
          msg: `Must be in ${payoutMethods}`
        }
      }
    },

    type: {
      type: DataTypes.STRING
    },

    data: DataTypes.JSON,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    confirmedAt: {
      type: DataTypes.DATE
    },

    archivedAt: {
      type: DataTypes.DATE
    },

    expiryDate: {
      type: DataTypes.DATE
    },

    initialBalance: {
      type: DataTypes.INTEGER,
      description: "Initial balance on this payment method. Current balance should be a computed value based on transactions."
    },

    matching: {
      type: DataTypes.INTEGER,
      description: "if not null, this payment method can only be used to match x times the donation amount"
    },

    limitedToTags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      description: "if not null, this payment method can only be used for collectives that have one the tags"
    },

    limitedToCollectiveIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      description: "if not null, this payment method can only be used for collectives listed by their id"
    }

  }, {
    paranoid: true,

    hooks: {

      beforeCreate: (instance) => {
        if (instance.service !== 'opencollective') {
          if (!instance.token) {
            throw new Error(`${instance.service} payment method requires a token`);
          }
          if (instance.service === 'stripe' && !instance.token.match(/^(tok|src)_[a-zA-Z0-9]{24}/)) {
            if (process.env.NODE_ENV !== 'production' && instance.token === 'tok_bypassPending' && instance.data.expMonth === 11 && instance.data.expYear === 23 && instance.data.zip === 10014) {
              // test token for end to end tests
            } else {
              throw new Error(`Invalid Stripe token ${instance.token}`);
            }
          }
        }
      }
    },

    getterMethods: {

      // Info.
      info() {
        return {
          id: this.id,
          uuid: this.uuid,
          token: this.token,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt,
          name: this.name,
          data: this.data
        }
      },

      features() {
        return libpayments.findPaymentMethodProvider(this).features;
      },

      minimal() {
        return {
          id: this.id,
          CreatedByUserId: this.CreatedByUserId,
          CollectiveId: this.CollectiveId,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt,
          expiryDate: this.expiryDate
        };
      }
    },
  });

  PaymentMethod.payoutMethods = payoutMethods;

  /**
   * Instance Methods
   */

  /**
   * Returns true if this payment method can be used for the given order
   * based on available balance and user
   * @param {Object} order { totalAmount, currency }
   * @param {Object} user instanceof models.User
   */
  PaymentMethod.prototype.canBeUsedForOrder = async function(order, user) {

    // if the user is trying to reuse an existing payment method,
    // we make sure it belongs to the logged in user or to a collective that the user is an admin of
    if (!user) throw new Error("You need to be logged in to be able to use a payment method on file");

    const name = (this.matching) ? 'matching fund' : `payment method (${this.service}:${this.type})`;

    if (this.expiryDate && new Date(this.expiryDate) < new Date) {
      throw new Error(`This ${name} has expired`);
    }

    if (order.interval && !get(this.features, 'recurring')) {
      throw new Error(`This ${name} doesn't support recurring payments`);
    }

    // If there is a monthly limit per member, the user needs to be a member or admin of the collective that owns the payment method
    if (this.monthlyLimitPerMember && !user.isMember(this.CollectiveId)) {
      throw new Error(`You don't have enough permissions to use this payment method (you need to be a member or an admin of the collective that owns this payment method)`);
    }

    // If there is no monthly limit, the user needs to be an admin of the collective that owns the payment method
    if (!this.monthlyLimitPerMember && !user.isAdmin(this.CollectiveId)) {
      throw new Error(`You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)`);
    }


    // We get an estimate of the total amount of the order in the currency of the payment method
    const orderCurrency = order.currency || get(order, 'collective.currency');
    const fxrate = await getFxRate(orderCurrency, this.currency);
    const totalAmountInPaymentMethodCurrency = order.totalAmount * fxrate;
    let orderAmountInfo = formatCurrency(order.totalAmount, orderCurrency);
    if (orderCurrency !== this.currency) {
      orderAmountInfo += ` ~= ${formatCurrency(totalAmountInPaymentMethodCurrency, this.currency)}`;
    }
    if (this.monthlyLimitPerMember && totalAmountInPaymentMethodCurrency > this.monthlyLimitPerMember) {
      throw new Error(`The total amount of this order (${orderAmountInfo}) is higher than your monthly spending limit on this ${name} (${formatCurrency(this.monthlyLimitPerMember, this.currency)})`);
    }

    const balance = await this.getBalanceForUser(user);
    if (totalAmountInPaymentMethodCurrency * this.matching > balance.amount) {
      throw new Error(`There is not enough funds left on this ${name} to match your order (balance: ${formatCurrency(balance.amount, this.currency)}`)
    }

    if (balance && totalAmountInPaymentMethodCurrency > balance.amount) {
      throw new Error(`You don't have enough funds available (${formatCurrency(balance.amount, this.currency)} left) to execute this order (${orderAmountInfo})`)
    }

    return true;
  }

  /**
   * getBalanceForUser
   * Returns the available balance of the current payment method based on:
   * - the balance of CollectiveId if service is opencollective
   * - the monthlyLimitPerMember if any and if the user is a member
   * - the available balance on the paykey for PayPal (not implemented yet)
   */
  PaymentMethod.prototype.getBalanceForUser = async function(user) {
    if (user && !(user instanceof models.User)) {
      throw new Error(`Internal error at PaymentMethod.getBalanceForUser(user): user is not an instance of User`);
    }

    const paymentProvider = libpayments.findPaymentMethodProvider(this);
    const getBalance = (paymentProvider && paymentProvider.getBalance)
      ? paymentProvider.getBalance
      : () => Promise.resolve(10000000); // GraphQL doesn't like Infinity

    // needed because giftcard payment method can be accessed without logged in
    if (libpayments.isProvider('opencollective.giftcard', this)) {
      return getBalance(this);
    }

    if (this.monthlyLimitPerMember && !user) {
      console.error(">>> this payment method has a monthly limit. Please provide a user to be able to compute their balance.");
      return { amount: 0, currency: this.currency };
    }

    if (user) {
      await user.populateRoles();
    }

    const balance = await getBalance(this);

    // Independently of the balance of the external source, the owner of the payment method
    // may have set up a monthlyLimitPerMember or an initialBalance
    if (!this.initialBalance && (!this.monthlyLimitPerMember || user && user.isAdmin(this.CollectiveId))) {
      return { amount: balance, currency: this.currency };
    }

    let limit = Infinity; // no no, no no no no, no no no no limit!
    const where = {
      PaymentMethodId: this.id,
      type: TransactionTypes.DEBIT
    };

    if (this.monthlyLimitPerMember) {
      limit = this.monthlyLimitPerMember;
      const d = new Date;
      const firstOfTheMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      where.createdAt = { [Op.gte]: firstOfTheMonth };
      where.CreatedByUserId = user.id;
    }

    if (this.initialBalance) {
      limit = (this.initialBalance > limit) ? limit : this.initialBalance;
    }

    const result = await sumTransactions('netAmountInCollectiveCurrency', { where }, this.currency);
    const availableBalance = limit + result.totalInHostCurrency; // result.totalInHostCurrency is negative
    return { amount: availableBalance, currency: this.currency };
  };

  /**
   * Class Methods
   */
  PaymentMethod.createFromStripeSourceToken = (PaymentMethodData) => {
    debug("createFromStripeSourceToken", PaymentMethodData);
    return stripe.createCustomer(null, PaymentMethodData.token)
      .then(customer => {
        PaymentMethodData.customerId = customer.id;
        PaymentMethodData.primary = true;
        return PaymentMethod.create(PaymentMethodData);
      });
  };

  /**
   * Create or get an existing payment method by uuid
   * This makes sure that the user can use this PaymentMethod
   * @param {*} user req.remoteUser
   * @param {*} paymentMethod { uuid } or { token, CollectiveId, ... } to create a new one and optionally attach it to CollectiveId
   * @post PaymentMethod { id, uuid, service, token, balance, CollectiveId }
   */
  PaymentMethod.getOrCreate = (user, paymentMethod) => {
    if (!paymentMethod.uuid) {
      // If no UUID provided, we create a new paymentMethod
      const paymentMethodData = {
        ...paymentMethod,
        service: paymentMethod.service || "stripe",
        CreatedByUserId: user.id,
        CollectiveId: paymentMethod.CollectiveId // might be null if the user decided not to save the credit card on file
      };
      debug("PaymentMethod.create", paymentMethodData);
      return models.PaymentMethod.create(paymentMethodData);
    } else if (paymentMethod.uuid && libpayments.isProvider('opencollective.giftcard', paymentMethod)) {
      return PaymentMethod.findOne({
        where: {
          uuid: paymentMethod.uuid,
          token: paymentMethod.token.toUpperCase(),
          archivedAt: null
        }
      })
      .then(pm => {
        if (!pm) {
          throw new Error(`Your gift card code doesn't exist`);
        } else {
          return pm;
        }
      });
    } else if (paymentMethod.uuid && paymentMethod.uuid.length === 8) {
      return PaymentMethod.getMatchingFund(paymentMethod.uuid);
    } else {
      return PaymentMethod
        .findOne({ where: { uuid: paymentMethod.uuid } })
        .then(pm => {
          if (!pm) {
            throw new Error(`You don't have a payment method with that uuid`);
          }
          return pm;
        })
    }
  }

  PaymentMethod.getMatchingFund = (shortUUID, options = {}) => {
    const where = {};
    if (options.ForCollectiveId) {
      where.limitedToCollectiveIds = Sequelize.or({ limitedToCollectiveIds: {[Op.eq]: null } }, { limitedToCollectiveIds: options.ForCollectiveId });
    }
    return PaymentMethod.findOne({
      where: Sequelize.and(
        Sequelize.where(Sequelize.cast(Sequelize.col('uuid'), 'text'), {[Op.like]: `${shortUUID}%` }),
        { matching: { [Op.ne]: null } }
      )
    }).then(async (pm) => {
      if (pm.expiryDate) {
        if (new Date(pm.expiryDate) < new Date) {
          throw new Error("This matching fund is expired");
        }
      }
      if (pm.limitedToCollectiveIds) {
        if (!options.ForCollectiveId || pm.limitedToCollectiveIds.indexOf(options.ForCollectiveId) === -1) {
          throw new Error("This matching fund is not available for this collective");
        }
      }
      if (pm.limitedToTags) {
        if (!options.ForCollectiveId) {
          throw new Error("Please provide a ForCollectiveId");
        }
        const collective = await models.Collective.findById(options.ForCollectiveId);
        if (intersection(collective.tags, pm.limitedToTags).length === 0) {
          throw new Error("This matching fund is not available to collectives in this category")
        }
      }
      return pm;
    });
  }

  return PaymentMethod;
}

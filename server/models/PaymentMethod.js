/** @module models/PaymentMethod */

import libdebug from 'debug';
import Promise from 'bluebird';
import { get, intersection } from 'lodash';
import { Op } from 'sequelize';

import { TransactionTypes } from '../constants/transactions';

import { sumTransactions } from '../lib/hostlib';
import { formatCurrency, formatArrayToString, cleanTags } from '../lib/utils';
import { getFxRate } from '../lib/currency';

import CustomDataTypes from './DataTypes';
import * as stripe from '../paymentProviders/stripe/gateway';
import * as libpayments from '../lib/payments';

import { maxInteger } from '../constants/math';

const debug = libdebug('PaymentMethod');

export default function(Sequelize, DataTypes) {
  const { models } = Sequelize;

  const payoutMethods = ['paypal', 'stripe', 'opencollective', 'prepaid'];

  const payoutTypes = ['creditcard', 'prepaid', 'payment', 'collective', 'adaptive', 'virtualcard'];

  const PaymentMethod = Sequelize.define(
    'PaymentMethod',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
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

      /**
       * Can be NULL when the user doesn't want to remember the payment method information (e.g. credit card info)
       * In that case we still need to store it for archive reasons (we want to be able to print the invoice and show the payment method that has been used)
       * But in the case, we don't link the payment method to the User/Org CollectiveId.
       */
      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      name: DataTypes.STRING, // custom human readable identifier for the payment method
      description: DataTypes.STRING, // custom human readable description
      customerId: DataTypes.STRING, // stores the id of the customer from the payment processor at the platform level
      token: DataTypes.STRING,
      primary: DataTypes.BOOLEAN,

      // Monthly limit in cents for each member of this.CollectiveId (in the currency of that collective)
      monthlyLimitPerMember: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },

      currency: CustomDataTypes(DataTypes).currency,

      service: {
        type: DataTypes.STRING,
        defaultValue: 'stripe',
        validate: {
          isIn: {
            args: [payoutMethods],
            msg: `Must be in ${payoutMethods}`,
          },
        },
      },

      type: {
        type: DataTypes.STRING,
        validate: {
          isIn: {
            args: [payoutTypes],
            msg: `Must be in ${payoutTypes}`,
          },
        },
      },

      data: DataTypes.JSON,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },

      confirmedAt: {
        type: DataTypes.DATE,
      },

      archivedAt: {
        type: DataTypes.DATE,
      },

      expiryDate: {
        type: DataTypes.DATE,
      },

      initialBalance: {
        type: DataTypes.INTEGER,
        description:
          'Initial balance on this payment method. Current balance should be a computed value based on transactions.',
        validate: {
          min: 0,
        },
      },

      limitedToTags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        description: 'if not null, this payment method can only be used for collectives that have one the tags',
        set(tags) {
          this.setDataValue('limitedToTags', cleanTags(tags));
        },
      },

      limitedToCollectiveIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        description: 'if not null, this payment method can only be used for collectives listed by their id',
      },

      limitedToHostCollectiveIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        description: 'if not null, this payment method can only be used for collectives hosted by these collective ids',
      },

      SourcePaymentMethodId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'PaymentMethods',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    },
    {
      paranoid: true,

      hooks: {
        beforeCreate: instance => {
          if (instance.service !== 'opencollective') {
            if (!instance.token) {
              throw new Error(`${instance.service} payment method requires a token`);
            }
            if (instance.service === 'stripe' && !instance.token.match(/^(tok|src|pm)_[a-zA-Z0-9]{24}/)) {
              if (process.env.NODE_ENV !== 'production' && stripe.isTestToken(instance.token)) {
                // test token for end to end tests
              } else {
                throw new Error(`Invalid Stripe token ${instance.token}`);
              }
            }
          }
        },
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
            data: this.data,
          };
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
            expiryDate: this.expiryDate,
          };
        },
      },
    },
  );

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
    if (!user) throw new Error('You need to be logged in to be able to use a payment method on file');

    const name = `payment method (${this.service}:${this.type})`;

    if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
      throw new Error(`This ${name} has expired`);
    }

    if (order.interval && !get(this.features, 'recurring')) {
      throw new Error(`This ${name} doesn't support recurring payments`);
    }

    if (this.limitedToTags) {
      const collective = order.collective || (await order.getCollective());
      if (intersection(collective.tags, this.limitedToTags).length === 0) {
        throw new Error(
          `This payment method can only be used for collectives in ${formatArrayToString(this.limitedToTags)}`,
        );
      }
    }

    // quick helper to get the name of a collective given its id to format better error messages
    const fetchCollectiveName = CollectiveId => {
      return (
        CollectiveId &&
        models.Collective.findOne({
          attributes: ['name'],
          where: { id: CollectiveId },
        }).then(r => r && r.name)
      );
    };

    if (this.limitedToCollectiveIds) {
      const collective = order.collective || (await order.getCollective());
      if (!this.limitedToCollectiveIds.includes(collective.HostCollectiveId)) {
        const collectives = await Promise.map(this.limitedToCollectiveIds, fetchCollectiveName);
        throw new Error(
          `This payment method can only be used for the following collectives ${formatArrayToString(collectives)}`,
        );
      }
    }

    if (this.limitedToHostCollectiveIds) {
      const collective = order.collective || (await order.getCollective());
      if (!this.limitedToHostCollectiveIds.includes(collective.HostCollectiveId)) {
        const hostCollectives = await Promise.map(this.limitedToHostCollectiveIds, fetchCollectiveName);
        throw new Error(
          `This payment method can only be used for collectives hosted by ${formatArrayToString(hostCollectives)}`,
        );
      }
    }

    // If there is no `this.CollectiveId`, it means that the user doesn't want to save this payment method to any collective
    // In that case, we need to check that the user is the creator of the payment method
    if (!this.CollectiveId) {
      if (user.id !== this.CreatedByUserId) {
        throw new Error(
          'This payment method is not saved to any collective and can only be used by the user that created it',
        );
      }
    } else {
      // If there is a monthly limit per member, the user needs to be a member or admin of the collective that owns the payment method
      if (this.monthlyLimitPerMember && !user.isMember(this.CollectiveId)) {
        throw new Error(
          "You don't have enough permissions to use this payment method (you need to be a member or an admin of the collective that owns this payment method)",
        );
      }

      // If there is no monthly limit, the user needs to be an admin of the collective that owns the payment method
      if (!this.monthlyLimitPerMember && !user.isAdmin(this.CollectiveId) && this.type !== 'manual') {
        throw new Error(
          "You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)",
        );
      }
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
      throw new Error(
        `The total amount of this order (${orderAmountInfo}) is higher than your monthly spending limit on this ${name} (${formatCurrency(
          this.monthlyLimitPerMember,
          this.currency,
        )})`,
      );
    }

    const balance = await this.getBalanceForUser(user);
    if (balance && totalAmountInPaymentMethodCurrency > balance.amount) {
      throw new Error(
        `You don't have enough funds available (${formatCurrency(
          balance.amount,
          this.currency,
        )} left) to execute this order (${orderAmountInfo})`,
      );
    }

    return true;
  };

  /**
   * Updates the paymentMethod.data with the balance on the preapproved paypal card
   */
  PaymentMethod.prototype.updateBalance = async function() {
    if (this.service !== 'paypal') {
      throw new Error('Can only update balance for paypal preapproved cards');
    }
    const paymentProvider = libpayments.findPaymentMethodProvider(this);
    return await paymentProvider.updateBalance(this);
  };

  /**
   * getBalanceForUser
   * Returns the available balance of the current payment method based on:
   * - the balance of CollectiveId if service is opencollective
   * - the monthlyLimitPerMember if any and if the user is a member
   * - the available balance on the paykey for PayPal (not implemented yet)
   */
  PaymentMethod.prototype.getBalanceForUser = async function(user) {
    if (user && !(user instanceof models.User)) {
      throw new Error('Internal error at PaymentMethod.getBalanceForUser(user): user is not an instance of User');
    }

    const paymentProvider = libpayments.findPaymentMethodProvider(this);
    const getBalance =
      paymentProvider && paymentProvider.getBalance ? paymentProvider.getBalance : () => Promise.resolve(maxInteger); // GraphQL doesn't like Infinity

    // Paypal Preapproved Key
    if (this.service === 'paypal' && !this.type) {
      return getBalance(this);
    }

    // needed because giftcard payment method can be accessed without logged in
    if (libpayments.isProvider('opencollective.giftcard', this)) {
      return getBalance(this);
    }

    if (this.monthlyLimitPerMember && !user) {
      console.error(
        '>>> this payment method has a monthly limit. Please provide a user to be able to compute their balance.',
      );
      return { amount: 0, currency: this.currency };
    }

    if (user) {
      await user.populateRoles();
    }
    // virtualcard monthlyLimitPerMember are calculated differently so the getBalance already returns the right result
    if (this.type === 'virtualcard') {
      return getBalance(this);
    }

    // Most paymentMethods getBalance functions return a {amount, currency} object while
    // collective payment method returns a raw number.
    const balance = await getBalance(this);
    const balanceAmount = typeof balance === 'number' ? balance : balance.amount;

    // Independently of the balance of the external source, the owner of the payment method
    // may have set up a monthlyLimitPerMember or an initialBalance
    if (!this.initialBalance && (!this.monthlyLimitPerMember || (user && user.isAdmin(this.CollectiveId)))) {
      return { amount: balanceAmount, currency: this.currency };
    }

    let limit = Infinity; // no no, no no no no, no no no no limit!
    const query = {
      where: { type: TransactionTypes.DEBIT },
      include: [
        {
          model: models.PaymentMethod,
          require: true,
          attributes: [],
          where: { [Op.or]: { id: this.id, SourcePaymentMethodId: this.id } },
        },
      ],
    };

    if (this.monthlyLimitPerMember) {
      limit = this.monthlyLimitPerMember;
      const d = new Date();
      const firstOfTheMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      query.where.createdAt = { [Op.gte]: firstOfTheMonth };
      query.where.CreatedByUserId = user.id;
    }

    if (this.initialBalance) {
      limit = this.initialBalance > limit ? limit : this.initialBalance;
    }

    const result = await sumTransactions('netAmountInCollectiveCurrency', query, this.currency);
    const availableBalance = limit + result.totalInHostCurrency; // result.totalInHostCurrency is negative
    return { amount: Math.min(balanceAmount, availableBalance), currency: this.currency };
  };

  /**
   * Returns the sum of the children PaymenMethod values (aka the virtual cards which
   * have `sourcePaymentMethod` set to this PM).
   */
  PaymentMethod.prototype.getChildrenPMTotalSum = async function() {
    return models.PaymentMethod.findAll({
      attributes: ['initialBalance', 'monthlyLimitPerMember'],
      where: { SourcePaymentMethodId: this.id },
    }).then(children => {
      return children.reduce((total, pm) => {
        return total + (pm.initialBalance || pm.monthlyLimitPerMember);
      }, 0);
    });
  };

  /**
   * Check if virtual card is claimed.
   * Always return true for other payment methods.
   */
  PaymentMethod.prototype.isConfirmed = function() {
    return this.type !== 'virtualcard' || this.confirmedAt !== null;
  };

  /**
   * Class Methods
   */
  PaymentMethod.createFromStripeSourceToken = (PaymentMethodData, options) => {
    debug('createFromStripeSourceToken', PaymentMethodData);
    return stripe.createCustomer(null, PaymentMethodData.token, options).then(customer => {
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
  PaymentMethod.getOrCreate = async (user, paymentMethod) => {
    if (!paymentMethod.uuid) {
      // If no UUID provided, we check if one with this token already exists
      const paymentMethodWithToken = await models.PaymentMethod.findOne({
        where: { token: paymentMethod.token },
      });
      if (paymentMethodWithToken) {
        return paymentMethodWithToken;
      }
      // If no UUID provided, we create a new paymentMethod
      const paymentMethodData = {
        ...paymentMethod,
        service: paymentMethod.service || 'stripe',
        CreatedByUserId: user.id,
        CollectiveId: paymentMethod.CollectiveId, // might be null if the user decided not to save the credit card on file
      };
      debug('PaymentMethod.create', paymentMethodData);
      return models.PaymentMethod.create(paymentMethodData);
    } else if (paymentMethod.uuid && libpayments.isProvider('opencollective.giftcard', paymentMethod)) {
      return PaymentMethod.findOne({
        where: {
          uuid: paymentMethod.uuid,
          token: paymentMethod.token.toUpperCase(),
          archivedAt: null,
        },
      }).then(pm => {
        if (!pm) {
          throw new Error("Your gift card code doesn't exist");
        } else {
          return pm;
        }
      });
    } else {
      return PaymentMethod.findOne({
        where: { uuid: paymentMethod.uuid },
      }).then(pm => {
        if (!pm) {
          throw new Error("You don't have a payment method with that uuid");
        }
        return pm;
      });
    }
  };

  return PaymentMethod;
}

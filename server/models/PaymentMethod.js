import * as stripe from '../gateways/stripe';
import { types as CollectiveTypes } from '../constants/collectives';
import { type as TransactionTypes } from '../constants/transactions';
import * as paymentProviders from '../paymentProviders';
import debugLib from 'debug';
const debug = debugLib('PaymentMethod');
import { sumTransactions } from '../lib/hostlib';

export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const payoutMethods = ['paypal', 'stripe', 'opencollective'];
  
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

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    identifier: DataTypes.STRING,
    primary: DataTypes.BOOLEAN,

    brand: {
      type: DataTypes.STRING,
      set(val) {
        if (val && val.toLowerCase) {
          this.setDataValue('brand', val.toLowerCase());
        }
      }
    },

    // Monthly limit in cents for each member of this.CollectiveId (in the currency of that collective)
    monthlyLimitPerMember: {
      type: DataTypes.INTEGER
    },

    expMonth: {
      type: DataTypes.INTEGER,
      set(val) {
        this.expiryDate = this.expiryDate || new Date;
        this.expiryDate.setMonth(val - 1);
        this.setDataValue('expMonth', Number(val));
      },
      validate: {
        'len': [1,2]
      }
    },

    expYear: {
      type: DataTypes.INTEGER,
      set(val) {
        this.expiryDate = this.expiryDate || new Date;
        this.expiryDate.setYear(val);
        this.setDataValue('expYear', Number(val));
      },
      validate: {
        'len': [4, 4]
      }
    },

    funding: DataTypes.STRING,
    country: DataTypes.STRING,
    fullName: DataTypes.STRING,
    token: DataTypes.STRING,
    customerId: DataTypes.STRING, // stores the id of the customer from the payment processor

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
    }
  }, {
    paranoid: true,

    hooks: {

      beforeCreate: (instance) => {
        if (instance.service !== 'opencollective') {
          if (!instance.token) {
            throw new Error(`${instance.service} payment method requires a token`);
          }
          if (instance.service === 'stripe' && !instance.token.match(/^tok_[a-zA-Z0-9]{24}/)) {
            throw new Error(`Invalid Stripe token ${instance.token}`);
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
          expMonth: this.expMonth,
          expYear: this.expYear,
          identifier: this.identifier,
          funding: this.funding,
          brand: this.brand,
          fullName: this.fullName,
          country: this.country
        };
      },

      features() {
        const paymentProvider = paymentProviders[this.service];
        return paymentProvider.features || {};
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
   * getBalanceForUser
   * Returns the available balance of the current payment method based on:
   * - the balance of CollectiveId if service is opencollective
   * - the monthlyLimitPerMember if any and if the user is a member
   * - the available balance on the paykey for PayPal (not implemented yet)
   */
  PaymentMethod.prototype.getBalanceForUser = function(user) {
    const paymentProvider = paymentProviders[this.service];
    let getBalance;
    debug("getBalanceForUser", user.dataValues, "paymentProvider:", this.service);
    if (paymentProvider.getBalance) {
      getBalance = paymentProvider.getBalance;
    } else {
      getBalance = () => Promise.resolve(Infinity);
    }

    return user.populateRoles()
      .then(() => getBalance(this))
      .then(balance => {

        if (!this.monthlyLimitPerMember || user.isAdmin(this.CollectiveId)) {
          return balance;
        }

        const d = new Date;
        const firstOfTheMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const where = {
          PaymentMethodId: this.id,
          CreatedByUserId: user.id,
          type: TransactionTypes.DONATION,
          createdAt: { $gte: firstOfTheMonth }
        };
        // TODO: add currency in the PaymentMethod model (need to specify the monthly spending limit in a given currency)
        let collective;
        return models.Collective.findOne({
          attribute: ['currency'],
          where: { id: this.CollectiveId }
        })
        .then(c => {
          collective = c;
          return sumTransactions('amount', where, collective.currency)
        })
        .then(result => {
          const availableBalance = this.monthlyLimitPerMember - result.totalInHostCurrency;
          return { amount: availableBalance, currency: collective.currency };
        });          
      });
  }

  /**
   * Class Methods
   */
  PaymentMethod.createFromStripeSourceToken = (PaymentMethodData) => {
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
        service: "stripe",
        CreatedByUserId: user.id,
        CollectiveId: paymentMethod.CollectiveId // might be null if the user decided not to save the credit card on file
      };
      debug("PaymentMethod.create", paymentMethodData);
      return models.PaymentMethod.create(paymentMethodData);
    } else {
      // if the user is trying to reuse an existing payment method,
      // we make sure it belongs to the logged in user or to a collective that the user is an admin of
      if (!user) throw new Error("You need to be logged in to be able to use a payment method on file");
      return models.PaymentMethod
        .findOne({ where: { uuid: paymentMethod.uuid } })
        .then(PaymentMethod => {
          if (!PaymentMethod) {
            throw new Error(`You don't have a payment method with that uuid`);
          }
          return models.Collective.findById(PaymentMethod.CollectiveId)
            .then(PaymentMethodCollective => {
              // If this PaymentMethod is associated to an organization, members can use it within limit
              if (PaymentMethodCollective.type === CollectiveTypes.ORGANIZATION) {
                if (!user.isMember(PaymentMethodCollective.id)) {
                  throw new Error("You don't have sufficient permissions to access this payment method");                      
                }
              } else {
                if (!user.isAdmin(PaymentMethodCollective.id)) {
                  throw new Error("You don't have sufficient permissions to access this payment method");                      
                }
              }
              return PaymentMethod;
            });
        })
    }
  }

  return PaymentMethod;
}

/**
 * Dependencies.
 */
import _ from 'lodash';
import Promise from 'bluebird';

/**
 * Model.
 */
export default (Sequelize, DataTypes) => {

  const Card = Sequelize.define('Card', {

    service: DataTypes.STRING, // paypal / stripe
    identifier: DataTypes.STRING, // paypalEmail / last4
    country: DataTypes.STRING,
    fullName: DataTypes.STRING,
    funding: DataTypes.STRING, // credit / debit

    brand: {
      type: DataTypes.STRING,
      set(val) {
        if (val && val.toLowerCase) {
          this.setDataValue('brand', val.toLowerCase());
        }
      }
    },

    expMonth: {
      type: DataTypes.INTEGER,
      validate: {
        'len': [1,2]
      }
    },

    expYear: {
      type: DataTypes.INTEGER,
      validate: {
        'len': [4, 4]
      }
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

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    paranoid: true,

    getterMethods: {

      // Info (private).
      info() {
        return {
          id: this.id,
          service: this.service, // stripe, paypal
          identifier: this.identifier, // last4 or paypalEmail
          fullName: this.fullName,
          funding: this.funding, // credit or debit
          brand: this.brand,
          country: this.country,
          expMonth: this.expMonth,
          expYear: this.expYear,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      },

      public() {
        return {};
      }
    },

    instanceMethods: {
    },

    classMethods: {
      createMany: (cards, defaultValues = {}) => {
        return Promise.map(cards, c => Card.create(_.defaults({}, c, defaultValues)), { concurrency: 1 });
      }
    }
  });

  return Card;
};

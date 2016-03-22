const config = require('config');

/**
 * Model.
 */

module.exports = (Sequelize, DataTypes) => {

 return Sequelize.define('ConnectedAccount', {
    provider: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['paypal', 'stripe']],
          msg: 'Must be paypal or stripe'
        }
      }
    },

    username: DataTypes.STRING, // paypal email

    clientId: DataTypes.STRING, // paypal app id

    secret: DataTypes.STRING, // paypal secret

    data: DataTypes.JSON,

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
      paypalConfig() {
        return {
          client_id: this.clientId,
          client_secret: this.secret,
          mode: config.paypal.rest.mode
        }
      }
    }

  });
};

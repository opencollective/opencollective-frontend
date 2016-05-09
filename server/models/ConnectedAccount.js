const config = require('config');

/**
 * Model.
 */

module.exports = (Sequelize, DataTypes) => {

  const allowedTypes = ['paypal', 'stripe', 'github', 'twitter'];

  return Sequelize.define('ConnectedAccount', {
    provider: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [allowedTypes],
          msg: `Must be in ${allowedTypes}`
        }
      }
    },

    username: DataTypes.STRING, // paypal email

    clientId: DataTypes.STRING, // paypal app id

    // either paypal secret OR an accessToken to do requests to the provider on behalf of the user
    secret: DataTypes.STRING, 

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

/**
 * Model.
 */

module.exports = function(Sequelize, DataTypes) {

  var StripeAccount = Sequelize.define('StripeAccount', {
    accessToken: DataTypes.STRING, // 'sk_xxx'
    refreshToken: DataTypes.STRING, // 'rt_xxx'
    tokenType: DataTypes.STRING, // 'bearer'
    stripePublishableKey: DataTypes.STRING, // 'pk_xxx'
    stripeUserId: DataTypes.STRING, // 'acct_xxx'
    scope: DataTypes.STRING, // 'read_write'

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }

  }, {
    paranoid: true
  });

  return StripeAccount;
};

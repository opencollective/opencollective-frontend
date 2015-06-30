module.exports = function(Sequelize, DataTypes) {

  var Paykey = Sequelize.define('Paykey', {
    trackingId: DataTypes.STRING,

    paykey: DataTypes.STRING,

    status: DataTypes.STRING,

    payload: DataTypes.JSON, // send to Paypal
    data: DataTypes.JSON, // received from Paypal
    error: DataTypes.JSON, // received from Paypal

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

  return Paykey;
};

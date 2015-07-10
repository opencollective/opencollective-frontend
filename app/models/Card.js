module.exports = function(Sequelize, DataTypes) {

  var Card = Sequelize.define('Card', {
    number: DataTypes.STRING,
    token: DataTypes.STRING,
    serviceId: DataTypes.STRING,
    service: {
      type: DataTypes.STRING,
      defaultValue: 'stripe'
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
    }
  }, {
    paranoid: true,

    getterMethods: {
      // Info.
      info: function() {
        return {
          id: this.id,
          number: this.number,
          token: this.token,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          confirmedAt: this.confirmedAt
        };
      }
    }
  });

  return Card;
};

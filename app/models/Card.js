module.exports = function(Sequelize, DataTypes) {

  var Card = Sequelize.define('Card', {
    number: DataTypes.STRING,
    token: DataTypes.STRING,
    serviceId: DataTypes.STRING,
    service: {
      type: DataTypes.STRING,
      defaultValue: 'stripe'
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
    getterMethods: {
      // Info.
      info: function() {
        return {
          id: this.id,
          number: this.number,
          service: this.service,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      }
    }
  });

  return Card;
};

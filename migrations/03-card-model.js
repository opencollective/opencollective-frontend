'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Cards', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      number: DataTypes.STRING,
      token: DataTypes.STRING,
      serviceId: DataTypes.STRING,
      service: {
        type: DataTypes.STRING,
        defaultValue: 'stripe',
      },
      data: DataTypes.JSON,
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      confirmedAt: {
        type: DataTypes.DATE,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Cards');
  },
};

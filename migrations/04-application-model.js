'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface.createTable('Applications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      api_key: DataTypes.STRING,
      name: DataTypes.STRING,
      href: DataTypes.STRING,
      description: DataTypes.STRING,
      disabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      _access: {
        type: DataTypes.FLOAT,
        defaultValue: 0, // 1: all access, 0.5: can create users
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: function(queryInterface) {
    return queryInterface.dropTable('Applications');
  },
};

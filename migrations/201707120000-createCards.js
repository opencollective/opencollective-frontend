'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable(
      'Cards', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
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

        service: DataTypes.STRING,
        funding: DataTypes.STRING,
        brand: DataTypes.STRING,
        country: DataTypes.STRING,
        fullName: DataTypes.STRING,
        identifier: DataTypes.STRING,
        expMonth: DataTypes.INTEGER,
        expYear: DataTypes.INTEGER,

        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },

        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },

        deletedAt: {
          type: DataTypes.DATE
        }
      }, {
        paranoid: true,
      })
  },

  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable('Cards');
  }
};

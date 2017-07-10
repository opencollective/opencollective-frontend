'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Tiers', 'GroupId', { 
        type: DataTypes.INTEGER,
        references: { model: 'Groups', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      })
      .then(() => queryInterface.addColumn('Tiers', 'interval', {
        type: DataTypes.STRING,
        defaultValue: 'one-time' // or month/year
      }))
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Tiers', 'GroupId')
      .then(() => queryInterface.removeColumn('Tiers', 'interval'))
  }
};

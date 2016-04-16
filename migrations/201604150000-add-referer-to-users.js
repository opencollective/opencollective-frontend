'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'referrerId', { 
      type: DataTypes.INTEGER,
      references: 'Users',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Users', 'referrerId');
    ;
  }
};
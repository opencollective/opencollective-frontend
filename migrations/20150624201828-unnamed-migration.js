'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.addColumn('Users', 'ApplicationId', {
      type: DataTypes.INTEGER,
      references: 'Applications',
      referencesKey: 'id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    }).then(function() {
      return queryInterface.changeColumn('Applications', '_access', {
        type: DataTypes.FLOAT
      });
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('Users', 'ApplicationId')
      .then(function() {
        return queryInterface.changeColumn('Applications', '_access', {
          type: DataTypes.INTEGER
        });
      });
  }
};

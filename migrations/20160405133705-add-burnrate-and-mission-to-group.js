'use strict';

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('Groups', 'burnrate', { type: DataTypes.INTEGER })
      .then(() => queryInterface.removeColumn('Groups', 'budget'))
      .then(() =>
        queryInterface.addColumn('Groups', 'mission', {
          type: DataTypes.STRING(100),
        }),
      )
      .then(() =>
        queryInterface.addColumn('Groups', 'budget', {
          type: DataTypes.INTEGER,
        }),
      )
      .then(() => queryInterface.removeColumn('Groups', 'expensePolicy'))
      .then(() =>
        queryInterface.addColumn('Groups', 'expensePolicy', {
          type: DataTypes.TEXT('long'),
        }),
      )
      .then(() => queryInterface.removeColumn('Groups', 'membershipType'))
      .then(() => queryInterface.removeColumn('Groups', 'membershipfee'));
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface
      .removeColumn('Groups', 'burnrate')
      .then(() =>
        queryInterface.addColumn('Groups', 'budget', { type: DataTypes.FLOAT }),
      )
      .then(() => queryInterface.removeColumn('Groups', 'mission'))
      .then(() =>
        queryInterface.addColumn('Groups', 'expensePolicy', {
          type: DataTypes.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Groups', 'membershipType', {
          type: DataTypes.STRING,
        }),
      )
      .then(() =>
        queryInterface.addColumn('Groups', 'membershipfee', {
          type: DataTypes.FLOAT,
        }),
      );
  },
};

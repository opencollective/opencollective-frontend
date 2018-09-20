'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Events', 'geoLocationLatLong', {
        type: Sequelize.GEOMETRY('POINT'),
      })
      .then(() =>
        queryInterface.renameColumn('Events', 'locationString', 'locationName'),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Events', 'geoLocationLatLong')
      .then(() =>
        queryInterface.renameColumn('Events', 'locaitonName', 'locationString'),
      )
      .then(() => queryInterface.sequelize.query('DROP EXTENSION postgis;'));
  },
};

'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Applications', [{
      api_key: '0ac43519edcf4421d80342403fb5985d',
      name: 'webapp',
      _access: 1
    }], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Applications', null, {});
  }
};

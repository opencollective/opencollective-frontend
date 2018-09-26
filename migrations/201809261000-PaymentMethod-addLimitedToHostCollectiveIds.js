'use strict';

const Promise = require('bluebird');

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('PaymentMethods', 'limitedToHostCollectiveIds', {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          description:
            'If not null, this payment method can only be used for collectives hosted by those ids',
        });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('PaymentMethods', 'limitedToHostCollectiveIds');
  },
};

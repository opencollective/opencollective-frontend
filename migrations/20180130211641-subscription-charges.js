'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Subscriptions', 'nextChargeDate', {
        type: Sequelize.DATE,
      })
      .then(() => {
        return queryInterface.addColumn('Subscriptions', 'nextPeriodStart', {
          type: Sequelize.DATE,
        });
      })
      .then(() => {
        return queryInterface.addColumn('Subscriptions', 'chargeRetryCount', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .removeColumn('Subscriptions', 'nextChargeDate')
      .then(() => {
        return queryInterface.removeColumn('Subscriptions', 'nextPeriodStart');
      })
      .then(() => {
        return queryInterface.removeColumn('Subscriptions', 'chargeRetryCount');
      });
  },
};

'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('PaymentMethods', 'type', {
        type: Sequelize.STRING,
      })
      .then(
        queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
        SET "type" = 'creditcard'
      WHERE type IS NULL AND service ilike 'stripe'
      `),
      )
      .then(
        queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
        SET "type" = 'collective'
      WHERE type is NULL AND service ilike 'opencollective'`),
      )
      .then(
        queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
        SET "service" = 'opencollective', type = 'prepaid'
      WHERE type is NULL and service ilike 'prepaid'`),
      )
      .then(
        queryInterface.sequelize.query(`
      UPDATE "PaymentMethods"
        SET type = 'adaptive'
      WHERE type is NULL and service ilike 'paypal'`),
      );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('PaymentMethods', 'type');
  },
};

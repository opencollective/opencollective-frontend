'use strict';

const Promise = require('bluebird');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('PaymentMethods', 'claimUrl', {
        type: Sequelize.STRING,
        description: "Url Used to claim the Payment method"
      })
      .then(() => queryInterface.addColumn('PaymentMethods', 'SourcePaymentMethodId', {
        type: Sequelize.INTEGER,
        references: { model: 'PaymentMethods', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description: "References the PaymentMethod used to actually pay"
      }));
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('PaymentMethods', 'claimUrl')
      .then(() => queryInterface.removeColumn('PaymentMethods', 'SourcePaymentMethodId'));
  }
};

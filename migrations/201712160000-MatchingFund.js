'use strict';

const Promise = require('bluebird');

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('PaymentMethods', 'initialBalance', {
        type: Sequelize.INTEGER,
        description:
          'Initial balance on this payment method. Current balance should be a computed value based on transactions.',
      })
      .then(() =>
        queryInterface.addColumn('PaymentMethods', 'matching', {
          type: Sequelize.INTEGER,
          description:
            'If not null, this payment method can only be used to match x times the donation amount',
        }),
      )
      .then(() =>
        queryInterface.addColumn('PaymentMethods', 'description', {
          type: Sequelize.STRING,
          description: 'Description of the matching fund',
        }),
      )
      .then(() =>
        queryInterface.addColumn('PaymentMethods', 'limitedToTags', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          description:
            'If not null, this payment method can only be used for collectives that have one the tags',
        }),
      )
      .then(() =>
        queryInterface.addColumn('PaymentMethods', 'limitedToCollectiveIds', {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          description:
            'If not null, this payment method can only be used for collectives listed by their id',
        }),
      )
      .then(() =>
        queryInterface.addColumn('Orders', 'MatchingPaymentMethodId', {
          type: Sequelize.INTEGER,
          references: { model: 'PaymentMethods', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          allowNull: true,
          description: 'References the PaymentMethod used to match',
        }),
      )
      .then(() =>
        queryInterface.addColumn('Orders', 'ReferralCollectiveId', {
          type: Sequelize.INTEGER,
          references: { model: 'Collectives', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          allowNull: true,
          description: 'Referral',
        }),
      );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('PaymentMethods', 'initialBalance')
      .then(() => queryInterface.removeColumn('PaymentMethods', 'matching'))
      .then(() =>
        queryInterface.removeColumn('PaymentMethods', 'limitedToTags'),
      )
      .then(() =>
        queryInterface.removeColumn('PaymentMethods', 'limitedToCollectiveIds'),
      )
      .then(() => queryInterface.removeColumn('PaymentMethods', 'description'))
      .then(() =>
        queryInterface.removeColumn('Orders', 'MatchingPaymentMethodId'),
      )
      .then(() =>
        queryInterface.removeColumn('Orders', 'ReferralCollectiveId'),
      );
  },
};

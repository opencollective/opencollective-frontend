'use strict';

module.exports = {
  up: async queryInterface => {
    // Mark existing matching funds as deleted
    await queryInterface.sequelize.query(`
      UPDATE  "PaymentMethods"
      SET     "deletedAt" = NOW()
      WHERE   matching IS NOT NULL
    `);

    // Remove columns
    await queryInterface.removeColumn('PaymentMethods', 'matching');
    await queryInterface.removeColumn('Orders', 'MatchingPaymentMethodId');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'MatchingPaymentMethodId', {
      type: Sequelize.INTEGER,
      references: { model: 'PaymentMethods', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true,
      description: 'References the PaymentMethod used to match',
    });

    await queryInterface.addColumn('PaymentMethods', 'matching', {
      type: Sequelize.INTEGER,
      description: 'If not null, this payment method can only be used to match x times the donation amount',
    });
  },
};

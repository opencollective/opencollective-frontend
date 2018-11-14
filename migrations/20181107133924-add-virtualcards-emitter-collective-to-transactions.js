'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('Transactions', 'UsingVirtualCardFromCollectiveId', {
        type: Sequelize.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description:
          'References the collective that created the virtual card used for this order',
      })
      .then(() => queryInterface.sequelize.sync())
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE  "Transactions" t
          SET     "UsingVirtualCardFromCollectiveId" = spm."CollectiveId"
          FROM    "PaymentMethods" pm, "PaymentMethods" spm
          WHERE   pm.id 	= t."PaymentMethodId"
          AND     spm.id 	= pm."SourcePaymentMethodId"
          AND     pm.type = 'virtualcard'
        `);
      });
  },

  down: queryInterface => {
    return queryInterface.removeColumn(
      'Transactions',
      'UsingVirtualCardFromCollectiveId',
    );
  },
};

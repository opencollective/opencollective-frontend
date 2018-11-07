'use strict';

const ORDERS_VC_COL_NAME = 'UsingVirtualCardFromCollectiveId';
const ordersVCColSettings = Sequelize => ({
  type: Sequelize.INTEGER,
  references: { model: 'Collectives', key: 'id' },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  allowNull: true,
  description:
    'References the collective that created the virtual card used for this order',
});

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('PaymentMethods', 'CreatedByCollectiveId', {
        type: Sequelize.INTEGER,
        references: { model: 'Collectives', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
        description:
          'References the collective that created this payment method',
      })
      .then(() =>
        queryInterface.addColumn(
          'Orders',
          ORDERS_VC_COL_NAME,
          ordersVCColSettings(Sequelize),
        ),
      )
      .then(() => {
        queryInterface.addColumn(
          'OrderHistories',
          ORDERS_VC_COL_NAME,
          ordersVCColSettings(Sequelize),
        );
      });
  },

  down: queryInterface => {
    return queryInterface
      .removeColumn('PaymentMethods', 'CreatedByCollectiveId')
      .then(() => queryInterface.removeColumn('Orders', ORDERS_VC_COL_NAME))
      .then(() =>
        queryInterface.removeColumn('OrderHistories', ORDERS_VC_COL_NAME),
      );
  },
};

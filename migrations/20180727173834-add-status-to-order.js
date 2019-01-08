'use strict';
import status from '../server/constants/order_status';
import models, { sequelize } from '../server/models';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const { Op } = Sequelize;

    return queryInterface
      .addColumn('Orders', 'status', {
        type: Sequelize.STRING,
        defaultValue: status.PENDING,
        allowNull: false,
      })
      .then(() =>
        queryInterface.addColumn('OrderHistories', 'status', {
          type: Sequelize.STRING,
          defaultValue: status.PENDING,
          allowNull: false,
        }),
      )
      .then(() =>
        queryInterface.sequelize.transaction(transaction => {
          const updatePaidOrders = models.Transaction.findAll({
            attributes: ['OrderId'],
            where: {
              OrderId: {
                [Op.not]: null,
              },
            },
          }).then(transactions => {
            const orders = transactions.map(t => t.OrderId);
            console.log(`Updating ${orders.length} orders to PAID`);
            const paidUpdate = models.Order.update(
              { status: status.PAID },
              {
                fields: ['status'],
                hooks: false,
                where: {
                  id: {
                    [Op.in]: orders,
                  },
                  SubscriptionId: null,
                },
                transaction,
              },
            );
            const errorUpdate = models.Order.update(
              { status: status.ERROR },
              {
                fields: ['status'],
                hooks: false,
                where: {
                  id: {
                    [Op.notIn]: orders,
                  },
                  SubscriptionId: null,
                },
                transaction,
              },
            );
            return Promise.all([paidUpdate, errorUpdate]);
          });
          const updateActiveOrders = models.Subscription.findAll({
            include: [
              {
                model: models.Order,
                required: true,
                attributes: ['id', 'status'],
              },
            ],
            where: {
              deactivatedAt: null,
            },
          }).then(subscriptions => {
            const orders = subscriptions.map(sub => sub.Order.id);
            console.log(`Updating ${orders.length} orders to ACTIVE`);
            return models.Order.update(
              { status: status.ACTIVE },
              {
                fields: ['status'],
                hooks: false,
                where: {
                  id: {
                    [Op.in]: orders,
                  },
                },
                transaction,
              },
            );
          });
          const updateCancelledSubscriptionOrders = models.Subscription.findAll({
            include: [
              {
                model: models.Order,
                required: true,
                attributes: ['id', 'status'],
              },
            ],
            where: {
              deactivatedAt: {
                [Op.not]: null,
              },
            },
          }).then(subscriptions => {
            const orders = subscriptions.map(sub => sub.Order.id);
            console.log(`Updating ${orders.length} orders to CANCELLED`);
            return models.Order.update(
              { status: status.CANCELLED },
              {
                fields: ['status'],
                hooks: false,
                where: {
                  id: {
                    [Op.in]: orders,
                  },
                },
                transaction,
              },
            );
          });
          const updateCancelledOrders = models.Order.update(
            { status: status.CANCELLED },
            {
              paranoid: false,
              fields: ['status'],
              hooks: false,
              where: {
                deletedAt: {
                  [Op.not]: null,
                },
              },
              transaction,
            },
          );

          console.log('Running updates to orders');
          return Promise.all([
            updatePaidOrders,
            updateActiveOrders,
            updateCancelledSubscriptionOrders,
            updateCancelledOrders,
          ]).catch(e => {
            console.error(e);
            throw e;
          });
        }),
      );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .removeColumn('Orders', 'status')
      .then(() => queryInterface.removeColumn('OrderHistories', 'status'));
  },
};

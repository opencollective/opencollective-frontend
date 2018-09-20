'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .createTable(
        'Expenses',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },

          UserId: {
            type: Sequelize.INTEGER,
            references: {
              model: 'Users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            allowNull: false,
          },

          GroupId: {
            type: Sequelize.INTEGER,
            references: {
              model: 'Groups',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            allowNull: false,
          },

          currency: {
            type: Sequelize.STRING,
            allowNull: false,
          },

          amount: {
            type: Sequelize.INTEGER,
            validate: { min: 1 },
            allowNull: false,
          },

          title: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          notes: Sequelize.TEXT,
          attachment: Sequelize.STRING,
          category: Sequelize.STRING,
          vat: Sequelize.INTEGER,

          lastEditedById: {
            type: Sequelize.INTEGER,
            references: {
              model: 'Users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            allowNull: false,
          },

          status: {
            type: Sequelize.STRING,
            defaultValue: 'PENDING',
            allowNull: false,
            validate: {
              isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED', 'PAID']],
                msg: 'Must be PENDING, APPROVED, REJECTED or PAID',
              },
            },
          },

          incurredAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },

          createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false,
          },

          updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false,
          },

          deletedAt: {
            type: Sequelize.DATE,
          },
        },
        {
          paranoid: true,
        },
      )
      .tap(() =>
        queryInterface.addColumn('Transactions', 'ExpenseId', {
          type: Sequelize.INTEGER,
          references: {
            model: 'Expenses',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
  },

  down: function(queryInterface) {
    return queryInterface
      .removeColumn('Transactions', 'ExpenseId')
      .then(() => queryInterface.dropTable('Expenses'));
  },
};

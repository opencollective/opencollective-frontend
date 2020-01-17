'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    const dbTransaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'ExpenseAttachments',
        {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          amount: { type: DataTypes.INTEGER, allowNull: false },
          url: { type: DataTypes.STRING, allowNull: false },
          description: { type: DataTypes.STRING, allowNull: true },
          createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
          updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
          deletedAt: { type: DataTypes.DATE },
          incurredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
          ExpenseId: {
            type: DataTypes.INTEGER,
            references: { model: 'Expenses', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            allowNull: false,
          },
          CreatedByUserId: {
            type: DataTypes.INTEGER,
            references: { key: 'id', model: 'Users' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            allowNull: true,
          },
        },
        { transaction: dbTransaction },
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "ExpenseAttachments" (
          "amount",
          "url",
          "createdAt",
          "updatedAt",
          "deletedAt",
          "incurredAt",
          "ExpenseId",
          "CreatedByUserId"
        ) SELECT 
          e."amount",
          e."attachment",
          e."createdAt",
          e."updatedAt",
          e."deletedAt",
          e."incurredAt",
          e."id",
          e."UserId"
        FROM 
          "Expenses" e
        WHERE 
          attachment IS NOT NULL
      `,
        { transaction: dbTransaction },
      );

      await queryInterface.removeColumn('Expenses', 'attachment', { transaction: dbTransaction });
      dbTransaction.commit();
    } catch (e) {
      console.error('Transaction failed:', e);
      await dbTransaction.rollback();
      throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dbTransaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'Expenses',
        'attachment',
        { type: Sequelize.STRING },
        { transaction: dbTransaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE ONLY "Expenses" e
        SET attachment = a.url
        FROM "ExpenseAttachments" a
        WHERE e.id = a."ExpenseId"
      `,
        { transaction: dbTransaction },
      );

      await queryInterface.dropTable('ExpenseAttachments', { transaction: dbTransaction });

      await dbTransaction.commit();
    } catch (e) {
      console.error('Transaction failed:', e);
      await dbTransaction.rollback();
      throw e;
    }
  },
};

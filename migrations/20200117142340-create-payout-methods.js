'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    const dbTransaction = await queryInterface.sequelize.transaction();

    try {
      const sequelizeParams = { transaction: dbTransaction };

      await queryInterface.createTable(
        'PayoutMethods',
        {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
          type: { type: DataTypes.ENUM('PAYPAL', 'OTHER'), allowNull: false },
          data: { type: DataTypes.JSON, allowNull: false },
          isSaved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
          createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
          updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
          deletedAt: { type: DataTypes.DATE },
          name: { type: DataTypes.STRING, allowNull: true },
          CollectiveId: {
            type: DataTypes.INTEGER,
            references: { model: 'Collectives', key: 'id' },
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
        sequelizeParams,
      );

      // Migrate paypal payment methods
      await queryInterface.sequelize.query(
        `
          INSERT INTO "PayoutMethods" (
            "type",
            "data",
            "CollectiveId",
            "CreatedByUserId",
            "createdAt",
            "updatedAt"
          ) SELECT 
            'PAYPAL',
            JSON_BUILD_OBJECT('email', u."paypalEmail"),
            u."CollectiveId",
            u."id",
            NOW(),
            NOW()
          FROM 
            "Users" u
          WHERE 
            u."paypalEmail" IS NOT NULL
          AND
            u."deletedAt" IS NULL
          AND
            u."CollectiveId" IS NOT NULL
        `,
        sequelizeParams,
      );

      // Create PayoutMethodId column for Expenses
      await queryInterface.addColumn(
        'Expenses',
        'PayoutMethodId',
        {
          type: DataTypes.INTEGER,
          references: { key: 'id', model: 'PayoutMethods' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          allowNull: true,
        },
        sequelizeParams,
      );

      await queryInterface.addColumn(
        'ExpenseHistories',
        'PayoutMethodId',
        { type: DataTypes.INTEGER, allowNull: true },
        sequelizeParams,
      );

      // Fill Expense's PayoutMethodId column
      await queryInterface.sequelize.query(
        `
          UPDATE ONLY "Expenses" e
          SET   "PayoutMethodId" = pm.id
          FROM  "PayoutMethods" pm
          WHERE pm."CollectiveId" = e."FromCollectiveId"
          AND   e."payoutMethod" = 'paypal'
          AND   pm.type = 'PAYPAL'
        `,
        sequelizeParams,
      );

      await queryInterface.removeColumn('Users', 'paypalEmail', sequelizeParams);
      await queryInterface.renameColumn('Expenses', 'payoutMethod', 'legacyPayoutMethod', sequelizeParams);
      await queryInterface.renameColumn('ExpenseHistories', 'payoutMethod', 'legacyPayoutMethod', sequelizeParams);
      await dbTransaction.commit();
    } catch (e) {
      console.error('Transaction failed:', e);
      await dbTransaction.rollback();
      throw e;
    }

    // Create index on PayoutMethods > CollectiveId. Cannot be done during the transaction
    await queryInterface.addIndex('PayoutMethods', ['CollectiveId']);
  },

  down: async (queryInterface, Sequelize) => {
    const dbTransaction = await queryInterface.sequelize.transaction();
    try {
      const sequelizeParams = { transaction: dbTransaction };

      // Re-add column
      await queryInterface.addColumn('Users', 'paypalEmail', { type: Sequelize.STRING }, sequelizeParams);

      // Fill column
      await queryInterface.sequelize.query(
        `
        UPDATE ONLY "Users" u
        SET "paypalEmail" = p.data ->> 'email'
        FROM "PayoutMethods" p
        WHERE p."CollectiveId" = u."CollectiveId"
      `,
        sequelizeParams,
      );

      // Remove added table and fields
      await queryInterface.removeColumn('Expenses', 'PayoutMethodId', sequelizeParams);
      await queryInterface.renameColumn('Expenses', 'legacyPayoutMethod', 'payoutMethod', sequelizeParams);
      await queryInterface.removeColumn('ExpenseHistories', 'PayoutMethodId', sequelizeParams);
      await queryInterface.renameColumn('ExpenseHistories', 'legacyPayoutMethod', 'payoutMethod', sequelizeParams);
      await queryInterface.dropTable('PayoutMethods', sequelizeParams);
      await dbTransaction.commit();
    } catch (e) {
      console.error('Transaction failed:', e);
      await dbTransaction.rollback();
      throw e;
    }
  },
};

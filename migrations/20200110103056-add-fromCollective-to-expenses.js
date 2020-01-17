'use strict';

/**
 * Adds a `FromCollectiveId` column to Expenses tables.
 *
 * Assuming that all expenses payees have a valid user and collective is safe, as the following
 * query returns no entry in production:
 *
 * ```
 * SELECT *
 * FROM "Expenses" e
 * LEFT JOIN "Users" u ON e."UserId" = u.id
 * LEFT JOIN "Collectives" c ON u."CollectiveId" = c.id
 * WHERE u.id IS NULL OR c.id IS NULL
 * ```
 *
 * `ExpenseHistories` does not enforces non-null values for `FromCollectiveId` because
 * their could be an important cost in migrating the data, and we actually don't care so much if
 * the old entries in History doesn't have a `FromCollectiveId`.
 */
module.exports = {
  up: async (queryInterface, DataTypes) => {
    const fromCollectiveFieldSettings = {
      type: DataTypes.INTEGER,
      references: { key: 'id', model: 'Collectives' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true, // We initially allow null for this field while we migrate the data
    };

    const dbTransaction = await queryInterface.sequelize.transaction();
    try {
      // Add column to Expense tables
      await queryInterface.addColumn('ExpenseHistories', 'FromCollectiveId', fromCollectiveFieldSettings, {
        transaction: dbTransaction,
      });

      await queryInterface.addColumn('Expenses', 'FromCollectiveId', fromCollectiveFieldSettings, {
        transaction: dbTransaction,
      });

      // Migrate the data for Expenses
      await queryInterface.sequelize.query(
        `
          UPDATE ONLY "Expenses"
          SET         "FromCollectiveId" = "Users"."CollectiveId"
          FROM        "Users"
          WHERE       "Expenses"."UserId" = "Users".id
        `,
        { transaction: dbTransaction },
      );

      // Enforce column on Expenses table
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Expenses" ALTER COLUMN "FromCollectiveId" SET NOT NULL;
        `,
        { transaction: dbTransaction },
      );

      // Run the transaction
      await dbTransaction.commit();
    } catch (e) {
      console.error('Transaction failed:', e);
      await dbTransaction.rollback();
      throw e;
    }
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('Expenses', 'FromCollectiveId');
    await queryInterface.removeColumn('ExpenseHistories', 'FromCollectiveId');
  },
};

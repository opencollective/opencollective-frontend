'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add a default email to all users with active memberships
    await queryInterface.sequelize.query(`
      UPDATE  "Users" AS u
      SET     "email" = FORMAT('missing-email-%s@opencollective.com', u.id)
      FROM    "Members" AS m
      WHERE   m."MemberCollectiveId" = u."CollectiveId"
      AND     m.id IS NOT NULL
      AND     m."deletedAt" IS NULL
      AND     u.email IS NULL
    `);

    // All the other users without email currently in the DB have no transactions
    // nor expenses, thus it should be safe to delete them all directly.
    await queryInterface.sequelize.query(`
      UPDATE  "Collectives" c
      SET     "deletedAt" = NOW()
      FROM    "Users" u
      WHERE   u."CollectiveId" = c.id
      AND     u.id IS NOT NULL
      AND     u."email" IS NULL
      AND     u."deletedAt" IS NULL
      AND     c."deletedAt" IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Users"
      SET     "deletedAt" = NOW()
      WHERE   "email" IS NULL
      AND     "deletedAt" IS NULL
    `);

    // Add default emails to remove any null values
    await queryInterface.sequelize.query(`
      UPDATE  "Users"
      SET     "email" = FORMAT('missing-email-%s@opencollective.com', id)
      WHERE   "email" IS NULL
    `);

    // Let's change the column to ensure email will never be null again
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },
};

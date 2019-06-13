'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Reset all collectives where the host is the parent
    await queryInterface.sequelize.query(
      `UPDATE "Collectives" SET "ParentCollectiveId" = NULL
      WHERE "type" = 'COLLECTIVE'
      AND "ParentCollectiveId" IS NOT NULL
      AND "ParentCollectiveId" != "HostCollectiveId"`,
    );
    // Reset all parentCollectiveId where it's not needed anymore
    await queryInterface.sequelize.query(
      `UPDATE "Collectives"
       SET "ParentCollectiveId" = NULL
       WHERE "type" = 'COLLECTIVE' AND "ParentCollectiveId" IN (
         83,   -- opensource (COLLECTIVE)
         8674, -- opencollective-host (ORGANIZATION)
         51,   -- wwcode (COLLECTIVE)
         969,  -- hostdemo (USER)
         207,  -- brusselstogether (COLLECTIVE)
         697,  -- affcny-collective (COLLECTIVE)
         9805, -- opensourceorg-old (COLLECTIVE)
         566,  -- operationcode-collective (COLLECTIVE)
         868,  -- europe-collective (COLLECTIVE)
         932,  -- changex (COLLECTIVE)
         842   -- uk-collective (COLLECTIVE)
      )`,
    );
  },

  down: (queryInterface, Sequelize) => {},
};

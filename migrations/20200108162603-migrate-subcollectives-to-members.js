'use strict';

/**
 * Migrate the notion of sub-collective from `ParentCollectiveId` to the `Members` table.
 */
module.exports = {
  up: queryInterface => {
    // Migrate sub-collectives previously linked with organizations through tags ("super collectives")
    // => This will be done manually, as malicious users seeing this migration could abuse it
    // by changing their collective's tags.

    // Migrate sub-collectives previously linked with `ParentCollectiveId`
    return queryInterface.sequelize.query(`
      WITH sub_collectives AS (
        -- Fetch the sub-collectives
        SELECT      c.*
        FROM        "Collectives" c
        INNER JOIN  "Collectives" pc ON c."ParentCollectiveId" = pc.id
        WHERE       c."type" = 'COLLECTIVE'
      ), new_members AS (
        -- Create Members with "SUB_COLLECTIVE" role
        INSERT INTO "Members" (
          "createdAt",
          "updatedAt",
          "since",
          "CreatedByUserId",
          "MemberCollectiveId",
          "CollectiveId",
          "role"
        ) SELECT
          NOW(),
          NOW(),
          NOW(),
          2, -- A user id must be provided, 2 is Xavier's id in dev & prod
          id,
          "ParentCollectiveId",
          'SUB_COLLECTIVE'
        FROM sub_collectives
        RETURNING *
      ) -- Reset "ParentCollectiveId" for all sub-collectives
        UPDATE  "Collectives" c
        SET     "ParentCollectiveId" = NULL
        WHERE   c.id IN (SELECT id FROM sub_collectives)
    `);
  },

  down: queryInterface => {
    return queryInterface.sequelize.query(`
      WITH sub_collectives_members AS (
        -- Fetch sub-collective members
        SELECT   m.*
        FROM    "Members" m
        WHERE   m."role" = 'SUB_COLLECTIVE'
      ), updated_sub_collectives AS (
        -- Update "ParentCollectiveId" with the member data
        UPDATE  "Collectives" c
        SET     "ParentCollectiveId" = sub_collectives_members."CollectiveId"
        FROM    sub_collectives_members
        WHERE   sub_collectives_members."MemberCollectiveId" = c.id
      ) -- Delete members
      DELETE FROM "Members" m
      WHERE m.id IN (SELECT id FROM sub_collectives_members)    
    `);
  },
};

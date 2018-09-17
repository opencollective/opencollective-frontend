'use strict';

const Promise = require('bluebird');

const DRY_RUN = false;
let usersProcessed = 0;

const populateCompanies = sequelize => {
  const updateUser = userCollective => {
    usersProcessed++;
    userCollective.company = `@${userCollective.organizationSlug}`;
    if (DRY_RUN) {
      console.log('>>> Update Collective', userCollective);
    } else {
      return sequelize.query(
        `UPDATE "Collectives" SET company=:company WHERE id=:id`,
        { replacements: userCollective },
      );
    }
  };

  return sequelize
    .query(
      `
    SELECT u.id as id, o.slug as "organizationSlug", o.name as "organizationName" FROM "Collectives" o
    LEFT JOIN "Members" m ON m."CollectiveId" = o.id
    LEFT JOIN "Collectives" u ON m."MemberCollectiveId" = u.id
    WHERE o.type='ORGANIZATION' AND u.type='USER' ORDER BY o."createdAt" DESC
  `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .map(updateUser);
};

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface
      .addColumn('Collectives', 'company', {
        type: Sequelize.STRING,
      })
      .then(() =>
        queryInterface.addColumn('CollectiveHistories', 'company', {
          type: Sequelize.STRING,
        }),
      )
      .then(() => populateCompanies(queryInterface.sequelize))
      .then(() => {
        console.log('>>> ', usersProcessed, 'users processed');
        if (DRY_RUN) {
          throw new Error('failing to rerun migration');
        }
      });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface
      .removeColumn('Collectives', 'company')
      .then(() =>
        queryInterface.removeColumn('CollectiveHistories', 'company'),
      );
  },
};

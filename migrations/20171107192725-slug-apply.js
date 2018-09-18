'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

const collectivesUpdated = [];

const DRY_RUN = false;

const updateApplyHosts = sequelize => {
  // Find each collective that has "HostId" in settings.
  // Find its host
  // Change collective's slug to slug+'-collective'
  // Change host to collective.slug and settings to apply = true
  // change collective.settings to remove HostId (tricky to do without models, so leaving it for now)

  return sequelize
    .query(
      `
    SELECT 
      c.id AS id,
      h.id AS "hostId",
      c.settings AS settings,
      h.settings AS "hostSettings",
      c.slug AS slug,
      h.slug as "hostSlug",
      c."HostCollectiveId" as "HostCollectiveId",
      c.tags as tags
      FROM "Collectives" c

    LEFT JOIN "Collectives" h on c."HostCollectiveId" = h.id

    WHERE (c."settings"::TEXT ILIKE '%HostId%') 
      AND c.id > 1 AND c.id != 39 AND c.id != 549 
      AND c.id != 829 AND c.id != 858 and c.id != 878
      AND h.id != 9805

    ORDER BY c.id; 
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(collectives => {
      console.log('>>> collectives found: ', collectives.length);
      return collectives;
    })
    .each(collective => {
      if (collective.slug.indexOf('collective') > 0) {
        console.log('skipping collective id', collective.id, collective.slug);
        return Promise.resolve();
      }

      const originalSlug = collective.slug;
      const newSlug = `${originalSlug}-collective`;
      let tags = '{}';
      if (collective.tags && collective.tags.length > 0) {
        tags = `{${collective.tags.join(',')}}`;
      }

      if (!collective.HostCollectiveId) {
        throw new Error('Collective found without host: ', collective.id);
      }

      console.log(
        '\n>>> Changing collective id',
        collective.id,
        'from',
        originalSlug,
        'to',
        newSlug,
      );
      console.log(
        '>>> Changing host collective id',
        collective.HostCollectiveId,
        'from',
        collective.hostSlug,
        'to',
        originalSlug,
      );
      // change original collective's slug
      return (
        sequelize
          .query(
            `
      UPDATE "Collectives"
        SET slug = :newSlug
      WHERE id = :collectiveId
    `,
            {
              replacements: {
                newSlug,
                collectiveId: collective.id,
              },
            },
          )
          // change host slug to the original slug and set apply = true
          .then(() =>
            sequelize.query(
              `
      UPDATE "Collectives"
        SET slug = :originalSlug, settings='{"apply": true}', tags= :tags
      WHERE id= :hostId 
      `,
              {
                replacements: {
                  originalSlug,
                  hostId: collective.HostCollectiveId,
                  tags: tags,
                },
              },
            ),
          )
          .then(() => {
            collectivesUpdated.push(collective);
          })
      );
    });
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return updateApplyHosts(queryInterface.sequelize).then(() => {
      console.log('>>> ', collectivesUpdated.length, 'collectivesUpdated');
      if (DRY_RUN) {
        throw new Error('failing to rerun migration');
      }
    });
  },

  down: (queryInterface, Sequelize) => {},
};

'use strict';

const DRY_RUN = false;
const collectivesUpdated = [];

const updateSlugs = sequelize => {
  return sequelize
    .query(
      `
    SELECT * FROM "Collectives"
    WHERE slug IS NULL;
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(collectives => {
      console.log('collectives found', collectives.length);
      return collectives;
    })
    .each(c => {
      let slug = '';
      if (c.name) {
        slug = c.name
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/\./g, '');
      }
      return sequelize
        .query(
          `
      SELECT * FROM "Collectives"
      WHERE slug LIKE :slug
      `,
          { type: sequelize.QueryTypes.SELECT, replacements: { slug } },
        )
        .then(collectives => {
          if (collectives.length > 0) {
            slug = `${slug}-${Math.floor(Math.random() * 1000 + 1)}`;
          }
          collectivesUpdated.push(c);
          return sequelize.query(
            `
        UPDATE "Collectives"
          SET slug = :slug
        WHERE id = :collectiveId
        `,
            {
              replacements: {
                slug,
                collectiveId: c.id,
              },
            },
          );
        });
    });
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return updateSlugs(queryInterface.sequelize)
      .then(() => {
        console.log('Collectives updated: ', collectivesUpdated.length);
      })
      .then(() => {
        if (DRY_RUN) throw new Error('throwing error to rerun migration');
      });
  },

  down: (queryInterface, Sequelize) => {
    // no way (and no need) to downgrade
    return Promise.resolve();
  },
};

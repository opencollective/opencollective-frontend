'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      CREATE INDEX collective_search_index ON "Collectives"
      USING gin((to_tsvector('simple', name) || to_tsvector('simple', slug) || to_tsvector('simple', COALESCE(description, ''))))
    `);
  },

  down: function(queryInterface) {
    return queryInterface.sequelize.query(`
      DROP INDEX "collective_search_index";
    `);
  },
};

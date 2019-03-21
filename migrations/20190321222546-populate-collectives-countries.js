'use strict';

/**
 * This migration tries to populate as much `countryISO` as possible, with a special
 * focus on Europe given that this information is important for legal reasons (VAT).
 *
 * It does it automatically for hosts we're sure about the country (eg. Brussels Together).
 * For events, we try to guess the country based on the location.address
 */
module.exports = {
  up: async queryInterface => {
    // Update all known belgium groups
    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'BE'
      WHERE   "countryISO" IS NULL
      AND     slug IN ('brusselstogether', 'brusselstogetherasbl', 'opencollectivebrussels', 'europe')
    `);

    // Update all known French groups (hosted by OpenCollective Paris)
    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'FR'
      WHERE   "countryISO" IS NULL
      AND     slug = 'paris' OR "HostCollectiveId" = 11284
    `);

    // Updates based on address
    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'BE', address = regexp_replace(address, ', (Belgium|Belgique)$', '')
      WHERE   "countryISO" IS NULL AND address ~ '(Belgium|Belgique)$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'US', address = regexp_replace(address, ', USA$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'USA$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'CA', address = regexp_replace(address, ', Canada$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'Canada$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'FR', address = regexp_replace(address, ', France$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'France$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'DE', address = regexp_replace(address, ', (Germany|Deutschland)$', '')
      WHERE   "countryISO" IS NULL AND address ~ '(Germany|Deutschland)$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'NL', address = regexp_replace(address, ', Netherlands$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'Netherlands$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'ES', address = regexp_replace(address, ', España$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'España$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'GR', address = regexp_replace(address, ', Greece$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'Greece$'
    `);

    await queryInterface.sequelize.query(`
      UPDATE  "Collectives"
      SET     "countryISO" = 'UK', address = regexp_replace(address, ', UK$', '')
      WHERE   "countryISO" IS NULL AND address ~ 'UK$'
    `);
  },

  down: () => {
    /*
      No revert for this migration.
    */
  },
};

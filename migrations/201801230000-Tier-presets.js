'use strict';

/**
 * Tier ids 121, 132, 391 and 1417 have presets that include a string "other"
 * @param {*} sequelize
 */
const migrateData = sequelize => {
  return sequelize.query(`
    UPDATE "Tiers" SET "updatedAt"='2018-01-23', "type"='DONATION', "presets"='[2000,5000,100000]' WHERE "id"=391;
    UPDATE "Tiers" SET "updatedAt"='2018-01-23', "type"='DONATION', "presets"='[1000,2500,10000,50000]' WHERE "id"=1417;
    UPDATE "Tiers" SET "updatedAt"='2018-01-23', "type"='DONATION', "presets"='[100000,500000,1000000]' WHERE "id"=132 OR "id"=121;
  `);
};

const cast = sequelize => {
  return sequelize.query(`
    WITH np AS (
      SELECT t.id, array_agg(e::text::int) as presets
      FROM "Tiers" t, json_array_elements(t."json_presets") e
      GROUP BY 1
      ORDER BY 1
    )
    UPDATE "Tiers" t SET presets=np.presets FROM np WHERE np.id=t.id AND t."json_presets" IS NOT NULL;
  `);
};

module.exports = {
  up: function(queryInterface, DataTypes) {
    return migrateData(queryInterface.sequelize)
      .then(() =>
        queryInterface.renameColumn('Tiers', 'presets', 'json_presets'),
      )
      .then(() =>
        queryInterface.addColumn('Tiers', 'presets', {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
        }),
      )
      .then(() => cast(queryInterface.sequelize))
      .then(() => queryInterface.removeColumn('Tiers', 'json_presets'));
  },

  down: function(queryInterface, DataTypes) {
    return queryInterface.changeColumn('Tiers', 'presets', {
      type: DataTypes.JSON,
    });
  },
};

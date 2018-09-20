'use strict';
/**
 * Moving 'brand', 'country', 'funding', 'fullName', 'expMonth', 'expYear' into PaymentMethod.data
 */
const Promise = require('bluebird');

const pick = (obj, attributes) => {
  const res = {};
  attributes.map(attr => {
    res[attr] = obj[attr];
  });
  return res;
};

const updatePaymentMethods = sequelize => {
  const getCollectiveById = id => {
    if (!id) return Promise.resolve(null);
    return sequelize
      .query(`SELECT id, currency FROM "Collectives" WHERE id=:id LIMIT 1`, {
        replacements: { id },
      })
      .then(res => {
        const collective = res.length > 0 && res[0][0];
        return collective;
      });
  };

  const updatePaymentMethod = pm => {
    const data = JSON.stringify(
      Object.assign(
        {},
        pick(pm, [
          'brand',
          'country',
          'funding',
          'fullName',
          'expMonth',
          'expYear',
        ]),
        pm.data,
      ),
    );

    return getCollectiveById(pm.CollectiveId).then(collective => {
      const currency = collective ? collective.currency : null;
      // console.log(">>> updating pm ", pm.id, "data", data, "currency", currency, "collective", collective);
      // return null;
      return sequelize.query(
        `UPDATE "PaymentMethods" SET data=:data, currency=:currency WHERE id=:id`,
        { replacements: { data, id: pm.id, currency } },
      );
    });
  };

  return sequelize
    .query(
      `SELECT * FROM "PaymentMethods" WHERE "CollectiveId" IS NOT NULL AND "expYear" IS NOT NULL`,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(pms => pms && Promise.map(pms, updatePaymentMethod));
};

module.exports = {
  up: function(queryInterface, DataTypes) {
    return queryInterface
      .addColumn('PaymentMethods', 'currency', { type: DataTypes.STRING(3) })
      .then(() => updatePaymentMethods(queryInterface.sequelize))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'funding'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'brand'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'country'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'fullName'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'expMonth'))
      .then(() => queryInterface.removeColumn('PaymentMethods', 'expYear'))
      .then(() =>
        queryInterface.renameColumn('PaymentMethods', 'identifier', 'name'),
      );
  },

  down: function(queryInterface, DataTypes) {
    console.log('>>> no downgrade possible');
  },
};

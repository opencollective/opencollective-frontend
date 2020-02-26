'use strict';
const { v4: uuidv4 } = require('uuid');

// Update all expenses payoutMethod from "manual" to "other"
// Make sure each organization has an "opencollective" paymentMethod

const Promise = require('bluebird');
const _ = require('lodash');

const DRY_RUN = false;
const paymentMethodsUpdated = [];

const updateExpenses = sequelize => {
  return sequelize.query(
    `
    UPDATE "Expenses" SET "payoutMethod"='other' WHERE "payoutMethod"='manual'
    `,
    { type: sequelize.QueryTypes.SELECT },
  );
};

const updatePaymentMethods = sequelize => {
  const updatePaymentMethod = pm => {
    paymentMethodsUpdated.push(pm);
    if (DRY_RUN) {
      console.log('> Updating ', pm.id, pm.service, pm.name);
    } else {
      return sequelize.query(`UPDATE "PaymentMethods" SET uuid=:uuid WHERE id=:id`, {
        replacements: { id: pm.id, uuid: uuidv4() },
      });
    }
  };

  return sequelize
    .query(`SELECT id, service, name FROM "PaymentMethods" WHERE uuid IS NULL`, { type: sequelize.QueryTypes.SELECT })
    .map(updatePaymentMethod);
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return updatePaymentMethods(queryInterface.sequelize).then(() => {
      console.log('>>> ', paymentMethodsUpdated.length, 'paymentMethodsUpdated');
      if (DRY_RUN) {
        throw new Error('failing to rerun migration');
      }
    });
  },

  down: (queryInterface, Sequelize) => {},
};

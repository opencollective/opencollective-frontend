'use strict';

// Update all expenses payoutMethod from "manual" to "other"
// Make sure each organization has an "opencollective" paymentMethod

const Promise = require('bluebird');
const _ = require('lodash');

const DRY_RUN = false;
const paymentMethodsAdded = [];

const capitalize = str => {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1);
};

const insert = (sequelize, table, entry) => {
  return sequelize.query(
    `
    INSERT INTO "${table}" ("${Object.keys(entry).join(
      '","',
    )}") VALUES (:${Object.keys(entry).join(',:')})
  `,
    { replacements: entry },
  );
};

const updateExpenses = sequelize => {
  return sequelize.query(
    `
    UPDATE "Expenses" SET "payoutMethod"='other' WHERE "payoutMethod"='manual'
    `,
    { type: sequelize.QueryTypes.SELECT },
  );
};

const addPaymentMethods = sequelize => {
  const addPaymentMethodForCollective = collective => {
    const pm = {
      CollectiveId: collective.id,
      service: 'opencollective',
      createdAt: new Date(),
      primary: true,
      name: `${capitalize(collective.name)} Collective`,
      currency: collective.currency,
    };

    paymentMethodsAdded.push(pm);

    if (DRY_RUN) {
      console.log(
        '>>> create payment method for ',
        collective.id,
        collective.slug,
        collective.type,
      );
      if (collective.type !== 'COLLECTIVE') {
        console.log(pm);
      }
    } else {
      return insert(sequelize, 'PaymentMethods', pm);
    }
  };

  return sequelize
    .query(`DELETE FROM "PaymentMethods" WHERE service='opencollective'`)
    .then(() => {
      return sequelize
        .query(
          `SELECT id, name, slug, currency, type FROM "Collectives" WHERE type='COLLECTIVE'`,
          { type: sequelize.QueryTypes.SELECT },
        )
        .map(addPaymentMethodForCollective);
    })
    .then(() => {
      // get all hosts
      return sequelize
        .query(
          `SELECT c.id, c.name, c.slug, c.currency, c.type FROM "Collectives" c LEFT JOIN "ConnectedAccounts" ca ON ca."CollectiveId" = c.id WHERE c.type!='COLLECTIVE' AND ca.service='stripe' AND ca."deletedAt" IS NULL`,
          { type: sequelize.QueryTypes.SELECT },
        )
        .map(addPaymentMethodForCollective);
    });
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return updateExpenses(queryInterface.sequelize)
      .then(() => addPaymentMethods(queryInterface.sequelize))
      .then(() => {
        console.log('>>> ', paymentMethodsAdded.length, 'paymentMethodsAdded');
        if (DRY_RUN) {
          throw new Error('failing to rerun migration');
        }
      });
  },

  down: (queryInterface, Sequelize) => {},
};

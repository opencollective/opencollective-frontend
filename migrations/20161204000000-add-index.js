'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      CREATE INDEX "Transactions_GroupId" ON "Transactions" USING btree ("GroupId","deletedAt");
      CREATE INDEX "Transactions_SubscriptionId" ON "Transactions" USING btree ("SubscriptionId");
    `);
  },

  down: function(queryInterface) {
    return queryInterface.sequelize.query(`
      DROP INDEX "Transactions_GroupId";;
      DROP INDEX "Transactions_SubscriptionId";
    `);
  },
};

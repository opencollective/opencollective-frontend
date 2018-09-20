'use strict';

// Only record Notifications when users unsubscribe to mailinglist.backers

// We remove all active email notifications (only keep the ones that have unsubscribed)

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query(
      `DELETE FROM "Notifications" WHERE active IS TRUE AND channel='email'`,
    );
  },

  down: (queryInterface, Sequelize) => {},
};

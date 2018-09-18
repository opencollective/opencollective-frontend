'use strict';

// Only record Notifications when users unsubscribe to user.yearlyreport

const Promise = require('bluebird');
const _ = require('lodash');

const DRY_RUN = false;
let notificationsProcessed = 0;

const deleteNotifications = sequelize => {
  if (DRY_RUN) {
    console.log('>>> removing notifications');
    return Promise.resolve();
  }
  return sequelize.query(
    `DELETE FROM "Notifications" WHERE (type='user.yearlyreport' OR type='user.monthlyreport') AND active IS TRUE`,
  );
};

const updateNotifications = sequelize => {
  const updateNotification = notification => {
    if (!notification.CollectiveId) {
      console.log(">>> can't update notification", notification);
      return Promise.resolve();
    }
    notificationsProcessed++;
    if (DRY_RUN) {
      console.log('>>> updating', notification);
      return Promise.resolve();
    }
    return sequelize
      .query(
        `UPDATE "Notifications" SET "CollectiveId"=:CollectiveId WHERE id=:id`,
        { replacements: notification },
      )
      .catch(e => {
        console.log('>>> error when updating', notification, ':', e.message);
        if (notification.id > 0) {
          console.log('deleting Notification id', notification.id);
          return sequelize.query(`DELETE FROM "Notifications" WHERE id=:id`, {
            replacements: notification,
          });
        }
      });
  };

  return sequelize
    .query(
      `SELECT n.id, u."CollectiveId" FROM "Notifications" n LEFT JOIN "Users" u ON n."UserId"=u.id WHERE (type='user.yearlyreport' OR type='user.monthlyreport') AND active IS FALSE`,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(notifications =>
      Promise.map(notifications, updateNotification, { concurrency: 1 }),
    );
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return deleteNotifications(queryInterface.sequelize)
      .then(() => updateNotifications(queryInterface.sequelize))
      .then(() => {
        console.log('>>> ', notificationsProcessed, 'notifications processed');
        if (DRY_RUN) {
          throw new Error('failing to rerun migration');
        }
      });
  },

  down: (queryInterface, Sequelize) => {},
};

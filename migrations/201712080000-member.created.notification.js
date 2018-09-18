'use strict';

const Promise = require('bluebird');

const DRY_RUN = false;
let notificationsCreated = 0;

const insert = (sequelize, table, entry) => {
  entry.createdAt = new Date();
  if (DRY_RUN) {
    console.log('>>> insert into ', table, JSON.stringify(entry));
    return Promise.resolve();
  } else {
    return sequelize
      .query(
        `
      INSERT INTO "${table}" ("${Object.keys(entry).join(
          '","',
        )}") VALUES (:${Object.keys(entry).join(',:')})
    `,
        { replacements: entry },
      )
      .catch(e => console.error('Error inserting', entry, e.name));
  }
};

const addNotifications = sequelize => {
  const insertNotification = notification => {
    notificationsCreated++;
    notification.channel = 'email';
    notification.type = 'collective.member.created';
    notification.active = true;
    if (DRY_RUN) {
      console.log('>>> Insert notification', notification);
    } else {
      return insert(sequelize, 'Notifications', notification);
    }
  };

  return sequelize
    .query(
      `
    SELECT u.id as "UserId", c.id as "CollectiveId"
    FROM "Users" u
    LEFT JOIN "Collectives" uc ON uc.id = u."CollectiveId"
    LEFT JOIN "Members" m on m."MemberCollectiveId"=uc.id
    LEFT JOIN "Collectives" c ON c.id=m."CollectiveId"
    WHERE m.role='ADMIN' AND (c.type='COLLECTIVE' OR c.type='EVENT')
  `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .map(insertNotification);
};

module.exports = {
  up: function(queryInterface, Sequelize) {
    return addNotifications(queryInterface.sequelize).then(() => {
      console.log('>>> ', notificationsCreated, 'users processed');
      if (DRY_RUN) {
        throw new Error('failing to rerun migration');
      }
    });
  },

  down: function(queryInterface, Sequelize) {
    return true;
  },
};

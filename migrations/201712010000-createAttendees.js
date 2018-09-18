'use strict';

// Add admins to EVENT Collectives and add Free Ticket Owners to the Members table
// We add all admins of the parent collective of an event as admins of the event
// We add all people who ordered a free ticket as ATTENDEE in the Members table

const Promise = require('bluebird');
const _ = require('lodash');

const DRY_RUN = false;
const membersCreated = [];
let eventsProcessed = 0;

const insert = (sequelize, table, entry) => {
  entry.createdAt = new Date();
  if (DRY_RUN) {
    console.log('>>> insert into ', table, JSON.stringify(entry));
    return Promise.resolve();
  } else {
    return sequelize.query(
      `
      INSERT INTO "${table}" ("${Object.keys(entry).join(
        '","',
      )}") VALUES (:${Object.keys(entry).join(',:')})
    `,
      { replacements: entry },
    );
  }
};

const processEvents = sequelize => {
  const processOrder = order => {
    const member = {
      CreatedByUserId: order.CreatedByUserId,
      CollectiveId: order.CollectiveId,
      MemberCollectiveId: order.FromCollectiveId,
      TierId: order.TierId,
      role: 'ATTENDEE',
    };
    membersCreated.push(member);
    return insert(sequelize, 'Members', member);
  };

  const processEvent = event => {
    eventsProcessed++;

    return sequelize
      .query(
        `SELECT "CreatedByUserId", "MemberCollectiveId" FROM "Members" WHERE role='ADMIN' AND "CollectiveId"=${
          event.ParentCollectiveId
        }`,
        { type: sequelize.QueryTypes.SELECT },
      )
      .map(admin =>
        insert(sequelize, 'Members', {
          CreatedByUserId: admin.CreatedByUserId,
          CollectiveId: event.id,
          MemberCollectiveId: admin.MemberCollectiveId,
          role: 'ADMIN',
        }),
      )
      .then(() =>
        sequelize.query(
          `SELECT * FROM "Orders" WHERE "CollectiveId"=${
            event.id
          } AND ("totalAmount" IS NULL OR "totalAmount"=0)`,
          { type: sequelize.QueryTypes.SELECT },
        ),
      )
      .map(processOrder);
  };

  return sequelize
    .query(
      `SELECT * FROM "Collectives" WHERE type='EVENT' AND "deletedAt" IS NULL`,
      { type: sequelize.QueryTypes.SELECT },
    )
    .map(processEvent);
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return processEvents(queryInterface.sequelize).then(() => {
      console.log(
        '>>> ',
        eventsProcessed,
        'events processed, ',
        membersCreated.length,
        'membersCreated',
      );
      if (DRY_RUN) {
        throw new Error('failing to rerun migration');
      }
    });
  },

  down: (queryInterface, Sequelize) => {},
};

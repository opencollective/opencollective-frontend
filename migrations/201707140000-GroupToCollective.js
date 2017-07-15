'use strict';

const dry = false;

/**
 * Rename Groups to Collectives
 * Adds Group.HostId
 * 
 * 
 * And populates them
 */
const Promise = require('bluebird');
const fetch = require('isomorphic-fetch');

let queriesToPerform = []; // we keep track of all queries to perform to make sure we can run them in one transaction
const cache = { ParentCollectiveIdForEventId: {}, HostIdForGroupId: {} };

function getDate(date = 'latest') {
  if (date.getFullYear) {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();    
    date = [date.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
  }
  return date;
}


const getHostId = (sequelize, groupid) => {
  if (cache.HostIdForGroupId[groupid]) return Promise.resolve(cache.HostIdForGroupId[groupid]);
  return sequelize.query(`
    SELECT "UserId" FROM "Roles" WHERE "CollectiveId"=:groupid AND role='HOST'
  `, { type: sequelize.QueryTypes.SELECT, replacements: { groupid }})
  .then(ug => {
    const HostId = ug[0] && ug[0].UserId;
    if (!HostId) {
      throw new Error(`Not host found for group id ${groupid}`);
    }
    cache.HostIdForGroupId[groupid] = HostId;
    return HostId;
  });
}


const getParentCollectiveId = (sequelize, EventId) => {
  if (cache.ParentCollectiveIdForEventId[EventId]) return Promise.resolve(cache.ParentCollectiveIdForEventId[EventId]);
  return sequelize.query(`
    SELECT id FROM "Collectives" WHERE data ->> 'EventId'='${EventId}'
  `, { type: sequelize.QueryTypes.SELECT })
  .then(res => {
    console.log(">>> query", `SELECT id FROM "Collectives" WHERE data ->> 'EventId'='${EventId}'`);
    console.log("res: ", res);
    const ParentCollectiveId = res && res.id;
    if (!ParentCollectiveId) {
      throw new Error(`No parent collective id found for event id ${EventId}`);
    }
    cache.ParentCollectiveIdForEventId[EventId] = ParentCollectiveId;
    return ParentCollectiveId;
  });
}


const createCollectivesForEvents = (sequelize) => {

  const updateTiersForEvents = () => {

    const updateTierForEvent = (tier) => {
      return getParentCollectiveId(sequelize, tier.EventId)
        .then(CollectiveId => {
          queriesToPerform.push({
            query: `UPDATE "Tiers" SET "CollectiveId"=:CollectiveId`,
            options: { replacements: { CollectiveId }}
          });
        })
    }
  
    return sequelize.query(`SELECT * FROM "Tiers" WHERE "EventId" IS NOT NULL`, { type: sequelize.QueryTypes.SELECT })
    .tap(tiers => console.log("Processing", tiers.length, "tiers", tiers))
    .then(tiers => tiers && Promise.map(tiers, updateTierForEvent))    
  }

  const createCollectiveForEvent = (event) => {

    const collective = Object.assign({}, event);
    collective.longDescription = event.description;
    collective.ParentCollectiveId = event.GroupId;
    collective.isActive = true;
    collective.type = 'EVENT';
    collective.tags = ['meetup', 'event'];
    collective.data = { EventId: event.id }
    delete collective.id;
    delete collective.description;
    delete collective.GroupId;

    return getHostId(sequelize, event.GroupId)
      .then(HostId => {
        collective.HostId = HostId;

        queriesToPerform.push({
          query: `INSERT INTO "Collectives" ("${Object.keys(collective).join('","')}") VALUES ('${Object.values(collective).join("','")}')`
        });
      })
  }

  return sequelize.query(`SELECT * FROM "Events"`, { type: sequelize.QueryTypes.SELECT })
  .tap(events => console.log("Processing", events.length, "events"))
  .then(events => events && Promise.map(events, createCollectiveForEvent))
  .then(() => console.log("queriesToPerform after createCollectiveForEvent: ", queriesToPerform))
  .then(() => queriesToPerform.length > 0 && Promise.all(queriesToPerform, (query) => {
    console.log("query to perform: ", query);
    return sequelize.query(query.query, query.options);
  }))
  .then(() => queriesToPerform = [])
  .then(() => updateTiersForEvents())
}


const createCollectivesForUsers = (sequelize) => {

  const createCollectiveForUser = (user) => {

    const collective = Object.assign({}, user);
    collective.isActive = true;
    collective.type = user.isOrganization ? 'ORGANIZATION' : 'USER';
    collective.tags = ['user'];
    collective.data = {};
    collective.data.UserId = user.id;
    collective.data.firstName = user.firstName;
    collective.data.lastName = user.lastName;
    collective.name = `${user.firstName} ${user.lastName}`;
    collective.slug = user.username;
    collective.image = user.avatar;
    collective.CreatedByUserId = user.id;
    delete collective.id;
    delete collective.username;
    delete collective.firstName;
    delete collective.lastName;
    delete collective.billingAddress;
    delete collective.isOrganization;
    delete collective.email;
    delete collective.avatar;

    queriesToPerform.push({
      query: `INSERT INTO "Collectives" ("${Object.keys(collective).join('","')}") VALUES ('${Object.values(collective).join("','")}')`
    });
  }

  return sequelize.query(`SELECT * FROM "Users"`, { type: sequelize.QueryTypes.SELECT })
  .tap(users => console.log("Processing", users.length, "users"))
  .then(users => users && Promise.map(users, createCollectiveForUser))
}

const updateCollectives = (sequelize) => {

  const addTiers = (group) => {
    let tiers = group.tiers || [];

    const getType = (tier) => {
      const name = tier.name && tier.name.toLowerCase();
      if (name.match(/sponsor/)) return 'SPONSOR';
      if (name.match(/donor/)) return 'DONOR';
      if (name.match(/member/)) return 'MEMBER';
      return 'BACKER';
    }

    tiers = tiers.map(tier => {
      const res = {
        type: getType(tier),
        name: tier.title || tier.name,
        slug: tier.name,
        interval: tier.interval,
        currency: group.currency,
        CollectiveId: group.id
      }
      if (tier.button) {
        res.button = tier.button; // call to action
      }
      if (tier.presets && tier.presets.length > 0) {
        res.presets = tier.presets;
      }
      if (tier.amount) {
        res.amount = Number(tier.amount) * 100;
      } else if (tier.presets && !isNaN(tier.presets[0])) {
        res.amount = Number(tier.presets[0]) * 100;
      } else if (tier.range) {
        res.amount = Number(tier.range[0]) * 100;
      }
      return res;
    });

    if (tiers.length === 0) {
      tiers.push({
        name: 'backer',
        type: 'BACKER',
        amont: 500,
        interval: 'month',
        CollectiveId: group.id,
        currency: group.currency
      });
      tiers.push({
        name: 'sponsor',
        type: 'SPONSOR',
        amont: 10000,
        interval: 'month',
        CollectiveId: group.id,
        currency: group.currency
      });
    }

    const donorTier = tiers.find(t => t.type === 'DONOR');
    if (!donorTier) {
      tiers.push({
        type: 'DONOR',
        name: 'donor',
        CollectiveId: group.id,
        currency: group.currency
      })
    }
    console.log("Inserting tiers", tiers);
    return Promise.map(tiers, tier => sequelize.query(`INSERT INTO "Tiers" ("${Object.keys(tier).join('","')}") VALUES ('${Object.values(tier).join("','")}')`));
  }

  const addUserToTiers = ({CollectiveId, UserId}, tiers) => {
    console.log(">>> addUserToTiers", "CollectiveId", CollectiveId, "UserId", UserId, tiers.length, "tiers", tiers);
    const stats = { totalDonations: 0, totalDonations: 0 };
    return sequelize.query(`
      SELECT d."createdAt", d.amount, s.interval 
      FROM "Donations" d LEFT JOIN "Subscriptions" s on d."SubscriptionId" = s.id
      WHERE s."deletedAt" IS NULL AND d."deletedAt" IS NULL
      AND d."CollectiveId"=:CollectiveId AND d."UserId"=:UserId`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { CollectiveId, UserId }
    })
    .tap(donations => console.log("processing ", donations.length, "for user", UserId, "in collective", CollectiveId))
    .then(donations => Promise.map(donations, (donation) => {
      console.log("Looking for a tier to match donation", donation);
      const tier = tiers.find(tier => {
        let found = false
        if (donation.amount >= tier.amount) {
          found = true;
        }
        if (donation.interval) {
          if (tier.interval !== donation.interval) found = false;
        }
        return found;
      });
      console.log("Tier found", { tier, createdAt: donation.createdAt });
      if (!tier) {
        return;
      }
      return sequelize.query(`
        INSERT INTO "Responses" ("UserId", "CollectiveId", "createdAt", "confirmedAt", "status")
        VALUES (:UserId, :CollectiveId, :createdAt, :createdAt, 'CONFIRMED')`, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { CollectiveId, UserId, TierId: tier.id, createdAt }
      });

    }))
  }

  const addUsersToTiers = (group, tiers) => {
    return sequelize.query(`SELECT "CollectiveId", "UserId" FROM "Roles" WHERE "CollectiveId"=:groupid AND role='BACKER' AND "deletedAt" IS NULL`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { groupid: group.id }
    })
    .tap(backers => console.log("Processing", backers.length, "backers", "CollectiveId", group.id))
    .then(ugs => Promise.map(ugs, (ug) => addUserToTiers(ug, tiers)))
  }

  // updateCollective
  // Add HostId to the group.
  const updateCollective = (group) => {
    let hostid;
    return addTiers(group)
    .tap((tiers) => console.log("Tiers added", tiers))
    .then((tiers) => addUsersToTiers(group, tiers))
      .then(() => getHostId(sequelize, group.id))
      .then(id => {
        hostid = id;
        const description = group.mission || group.description;
        if (!hostid) throw new Error(`Unable to update group ${group.id}: No HostId for group ${group.slug}`);
        queriesToPerform.push({
          query: `UPDATE "Collectives" SET description=:description, "HostId"=:hostid WHERE id=:id`,
          options: { replacements: { id: group.id, hostid, description }}
        });
      })
  }

  return sequelize.query(`SELECT * FROM "Collectives"`, { type: sequelize.QueryTypes.SELECT })
  .then(collectives => collectives && Promise.map(collectives, updateCollective))
}


const dryUp = (queryInterface, Sequelize) => {
    return createCollectivesForEvents(queryInterface.sequelize)
    .then(() => updateCollectives(queryInterface.sequelize))
    .then(() => createCollectivesForUsers(queryInterface.sequelize))
    .then(() => {
      console.log(queriesToPerform)
    })
}

const up = (queryInterface, Sequelize) => {

  return queryInterface.renameTable('Groups', 'Collectives')
    .then(() => queryInterface.addColumn('Collectives', 'CreatedByUserId', {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }))
    .then(() => queryInterface.renameColumn('Collectives', 'lastEditedByUserId', 'LastEditedByUserId')) // Foreign Keys should respect the pattern "UserId" (camel case)
    .then(() => queryInterface.addColumn('Collectives', 'HostId', {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }))
    .then(() => queryInterface.addColumn('Collectives', 'ParentCollectiveId', {
      type: Sequelize.INTEGER,
      references: { model: 'Collectives', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }))
    .then(() => queryInterface.addColumn('Collectives', 'type', {
      type: Sequelize.STRING,
      defaultValue: "COLLECTIVE"
    }))
    .then(() => queryInterface.addColumn('Collectives', 'startsAt', {
      type: Sequelize.DATE
    }))
    .then(() => queryInterface.addColumn('Collectives', 'endsAt', {
      type: Sequelize.DATE
    }))
    .then(() => queryInterface.addColumn('Collectives', 'locationName', {
      type: Sequelize.STRING
    }))
    .then(() => queryInterface.addColumn('Collectives', 'address', {
      type: Sequelize.STRING
    }))
    .then(() => queryInterface.addColumn('Collectives', 'timezone', {
      type: Sequelize.STRING
    }))
    .then(() => queryInterface.addColumn('Collectives', 'maxAmount', {
      type: Sequelize.INTEGER,
      min: 0
    }))
    .then(() => queryInterface.addColumn('Collectives', 'maxQuantity', {
      type: Sequelize.INTEGER,
      min: 0
    }))
    .then(() => queryInterface.addColumn('Collectives', 'geoLocationLatLong', {
      type: Sequelize.GEOMETRY('POINT')
    }))
    .then(() => queryInterface.addColumn('Tiers', 'button', { type: Sequelize.STRING }))
    .then(() => queryInterface.addColumn('Tiers', 'presets', { type: Sequelize.JSON }))
    .then(() => queryInterface.renameColumn('Responses', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Activities', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('ApplicationGroup', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Comments', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('ConnectedAccounts', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Donations', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Events', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Expenses', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Notifications', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Tiers', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('Transactions', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameColumn('UserGroups', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameTable('UserGroups', 'Roles'))
    .then(() => createCollectivesForEvents(queryInterface.sequelize))
    .then(() => updateCollectives(queryInterface.sequelize))
    .then(() => createCollectivesForUsers(queryInterface.sequelize))
    .then(() => queryInterface.removeColumn('Tiers', 'EventId'))
    .then(() => queryInterface.removeColumn('Collectives', 'mission'))
    .then(() => queryInterface.removeColumn('Collectives', 'tiers'))
    .then(() => queryInterface.removeColumn('Collectives', 'logo'))
    .then(() => queriesToPerform.length > 0 && Promise.all(queriesToPerform, (query) => {
      console.log("query to perform: ", query);
      return sequelize.query(query.query, query.options);
    }))
    .catch(e => {
      console.error("Error in migration. Reverting back.", e);
      throw e;
      // return down(queryInterface, Sequelize).then(() => {
      //   throw new Error("Reverted back");
      // })
    })
};

const down = (queryInterface, Sequelize) => {
  queryInterface.renameTable('Collectives', 'Groups')
    .then(() => queryInterface.removeColumn('Groups', 'CreatedByUserId'))
    .then(() => queryInterface.renameColumn('Groups', 'LastEditedByUserId', 'lastEditedByUserId'))
    .then(() => queryInterface.removeColumn('Groups', 'HostId'))
    .then(() => queryInterface.removeColumn('Groups', 'ParentCollectiveId'))
    .then(() => queryInterface.removeColumn('Groups', 'type'))
    .then(() => queryInterface.removeColumn('Groups', 'startsAt'))
    .then(() => queryInterface.removeColumn('Groups', 'endsAt'))
    .then(() => queryInterface.removeColumn('Groups', 'locationName'))
    .then(() => queryInterface.removeColumn('Groups', 'address'))
    .then(() => queryInterface.removeColumn('Groups', 'timezone'))
    .then(() => queryInterface.removeColumn('Groups', 'maxAmount'))
    .then(() => queryInterface.removeColumn('Groups', 'maxQuantity'))
    .then(() => queryInterface.removeColumn('Groups', 'geoLocationLatLong'))
    .then(() => queryInterface.addColumn('Groups', 'mission', { type: Sequelize.STRING }))
    .then(() => queryInterface.addColumn('Groups', 'logo', { type: Sequelize.STRING }))
    .then(() => queryInterface.addColumn('Groups', 'tiers', { type: Sequelize.JSON }))
    .then(() => queryInterface.addColumn('Tiers', 'EventId', {
      type: Sequelize.INTEGER,
      references: { model: 'Events', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }))
  .then(() => queryInterface.removeColumn('Tiers', 'button'))
    .then(() => queryInterface.removeColumn('Tiers', 'presets'))
    .then(() => queryInterface.renameColumn('Tiers', 'CollectiveId', 'GroupId'))
    .then(() => revertGroups(queryInterface.sequelize))
}

module.exports = {
  up: (dry) ? dryUp : up,
  down
};

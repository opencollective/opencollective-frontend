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


const getHostId = (sequelize, CollectiveId) => {
  if (cache.HostIdForGroupId[CollectiveId]) return Promise.resolve(cache.HostIdForGroupId[CollectiveId]);
  return sequelize.query(`
    SELECT "UserId" FROM "Roles" WHERE "CollectiveId"=:CollectiveId AND role='HOST'
  `, { type: sequelize.QueryTypes.SELECT, replacements: { CollectiveId }})
  .then(ug => {
    const HostId = ug[0] && ug[0].UserId || null;
    if (!HostId) {
      console.error(`No host found for group id ${CollectiveId}`);
    }
    cache.HostIdForGroupId[CollectiveId] = HostId;
    return HostId;
  });
}


const getParentCollectiveId = (sequelize, EventId) => {
  if (cache.ParentCollectiveIdForEventId[EventId]) return Promise.resolve(cache.ParentCollectiveIdForEventId[EventId]);
  return sequelize.query(`
    SELECT id FROM "Collectives" WHERE data ->> 'EventId'='${EventId}'
  `, { type: sequelize.QueryTypes.SELECT })
  .then(res => {
    const ParentCollectiveId = res && res.length > 0 && res[0].id;
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
          return sequelize.query(`UPDATE "Tiers" SET "CollectiveId"=:CollectiveId WHERE id=:TierId`, { replacements: { CollectiveId, TierId: tier.id } });
        })
    }
  
    return sequelize.query(`SELECT id, "EventId" FROM "Tiers" WHERE "EventId" IS NOT NULL`, { type: sequelize.QueryTypes.SELECT })
    .tap(tiers => console.log("Processing", tiers.length, "tiers"))
    .then(tiers => tiers && Promise.map(tiers, updateTierForEvent))    
  }

  const createCollectiveForEvent = (event) => {

    const collective = Object.assign({}, event);
    collective.longDescription = event.description;
    collective.ParentCollectiveId = event.CollectiveId;
    collective.isActive = true;
    collective.type = 'EVENT';
    collective.tags = '{"meetup", "event"}';
    if (event.geoLocationLatLong && event.geoLocationLatLong.coordinates) {
      const [ lat, long ] = event.geoLocationLatLong.coordinates;
      collective.geoLocationLatLong = `POINT(${lat} ${long})`;
    } else {
      delete collective.geoLocationLatLong;
    }
    collective.data = JSON.stringify({ EventId: event.id });
    collective.CreatedByUserId = event.createdByUserId;
    delete collective.id;
    delete collective.description;
    delete collective.CollectiveId;
    delete collective.createdByUserId;

    return getHostId(sequelize, event.CollectiveId)
      .then(HostId => {
        collective.HostId = HostId;
        return sequelize.query(`
          INSERT INTO "Collectives" ("${Object.keys(collective).join('","')}") VALUES (:${Object.keys(collective).join(",:")})
        `, { replacements: collective });
      })
  }

  return sequelize.query(`SELECT * FROM "Events"`, { type: sequelize.QueryTypes.SELECT })
  .tap(events => console.log("Processing", events.length, "events"))
  .then(events => events && Promise.map(events, createCollectiveForEvent))
  .then(() => updateTiersForEvents())
}


const createCollectivesForUsers = (sequelize) => {

  const createCollectiveForUser = (user) => {

    const collective = {
      isActive: true,
      type: user.isOrganization ? 'ORGANIZATION' : 'USER',
      name: `${user.firstName} ${user.lastName}`,
      slug: user.username,
      image: user.image,
      CreatedByUserId: user.id,
      tags: '{user}',
      data: JSON.stringify({ UserId: user.id }),
      createdAt: user.createdAt,
      twitterHandle: user.twitterHandle,
      longDescription: user.longDescription,
      website: user.website
    };

    if (user.currency) {
      collective.currency = user.currency;
    }
    if (user.mission) {
      collective.mission = user.mission.replace(/<[^>]+>/g,''); // remove <html>
    }
    if (user.description) {
      collective.description = user.description.replace(/<[^>]+>/g,''); // remove <html>
    }
    return sequelize.query(`
      INSERT INTO "Collectives" ("${Object.keys(collective).join('","')}") VALUES (:${Object.keys(collective).join(",:")})
    `, { replacements: collective }).catch(e => {
      console.log(">>> Error inserting collective for user", user.username, "collective", collective, "error:", e);
    });
  }

  return sequelize.query(`SELECT id, "isOrganization", username, "firstName", "lastName", image, "createdAt", "twitterHandle", mission, description, "longDescription", website, currency FROM "Users"`, { type: sequelize.QueryTypes.SELECT })
  .tap(users => console.log("Processing", users.length, "users"))
  .then(users => users && Promise.map(users, createCollectiveForUser))
}

const updateCollectives = (sequelize) => {

  const addTiers = (collective) => {
    let tiers = collective.tiers || [];

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
        currency: collective.currency,
        CollectiveId: collective.id
      }
      if (tier.interval) {
        const interval = tier.interval.replace(/ly/,'');
        if (['month','year'].indexOf(interval) !== -1) {
          res.interval = interval;
        }
      }
      if (tier.button) {
        res.button = tier.button; // call to action
      }
      if (tier.presets && tier.presets.length > 0) {
        const presets = tier.presets.map(p => {
          if (isNaN(p)) return `"${p}"`;
          return p
        })
        res.presets = `[${presets}]`;
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
        amount: 500,
        interval: 'month',
        CollectiveId: collective.id,
        currency: collective.currency
      });
      tiers.push({
        name: 'sponsor',
        type: 'SPONSOR',
        amount: 10000,
        interval: 'month',
        CollectiveId: collective.id,
        currency: collective.currency
      });
    }

    const donorTier = tiers.find(t => t.type === 'DONOR');
    if (!donorTier) {
      tiers.push({
        type: 'DONOR',
        name: 'donor',
        CollectiveId: collective.id,
        currency: collective.currency
      })
    }
    return Promise.map(tiers, tier => sequelize.query(`
      INSERT INTO "Tiers" ("${Object.keys(tier).join('","')}", "createdAt") VALUES ('${Object.values(tier).join("','")}', :createdAt)
      `, {
        replacements: { createdAt: new Date }
      }))
      .then(() => tiers = null) // save memory
      .then(() => sequelize.query(`SELECT id, "CollectiveId", amount, interval FROM "Tiers"`, { type: sequelize.QueryTypes.SELECT }));
  }

  const addUserToTiers = ({CollectiveId, UserId}, tiers) => {
    const stats = { totalDonations: 0, totalDonations: 0 };
    return sequelize.query(`
      SELECT d."createdAt", d.amount, s.interval, d."CollectiveId"
      FROM "Donations" d LEFT JOIN "Subscriptions" s on d."SubscriptionId" = s.id
      WHERE s."deletedAt" IS NULL AND d."deletedAt" IS NULL
      AND d."CollectiveId"=:CollectiveId AND d."UserId"=:UserId`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { CollectiveId, UserId }
    })
    .then(donations => Promise.map(donations, (donation) => {
      const tier = tiers.find(tier => {
        if (tier.CollectiveId != donation.CollectiveId) return false;
        if (donation.amount < tier.amount) return false;
        if (donation.interval && (tier.interval !== donation.interval)) return false;
        return true;
      });
      if (!tier) {
        return;
      }
      return sequelize.query(`
        INSERT INTO "Responses" ("UserId", "CollectiveId", "TierId", "createdAt", "confirmedAt", "status")
        VALUES (:UserId, :CollectiveId, :TierId, :createdAt, :createdAt, 'CONFIRMED')`, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { CollectiveId, UserId, TierId: tier.id, createdAt: donation.createdAt }
      });

    }))
  }

  const addUsersToTiers = (collective, tiers) => {
    return sequelize.query(`SELECT "CollectiveId", "UserId" FROM "Roles" WHERE "CollectiveId"=:collectiveid AND role='BACKER' AND "deletedAt" IS NULL`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { collectiveid: collective.id }
    })
    .then(ugs => Promise.map(ugs, (ug) => addUserToTiers(ug, tiers)))
  }

  /**
   * updateCollective
   * - Add HostId and description to the collective
   * - Add tiers to the new "Tiers" table
   * - Attach users to their respective tier
   */ 
  const updateCollective = (collective) => {
    let hostid;
    return addTiers(collective)
      .then((tiers) => addUsersToTiers(collective, tiers))
      .then(() => getHostId(sequelize, collective.id))
      .then(id => {
        hostid = id;
        // if (!hostid) throw new Error(`Unable to update collective ${collective.id}: No HostId for collective ${collective.slug}`);
        return sequelize.query(`UPDATE "Collectives" SET "HostId"=:hostid WHERE id=:id`,
          { replacements: { id: collective.id, hostid } });
      })
  }

  return sequelize.query(`SELECT id, slug, mission, description, currency, tiers FROM "Collectives"`, { type: sequelize.QueryTypes.SELECT })
  .then(collectives => collectives && Promise.map(collectives, updateCollective))
}


const dryUp = (queryInterface, Sequelize) => {
    return createCollectivesForEvents(queryInterface.sequelize)
    .then(() => updateCollectives(queryInterface.sequelize))
    .then(() => createCollectivesForUsers(queryInterface.sequelize))
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
    .then(() => queryInterface.renameColumn('Users', 'avatar', 'image'))
    .then(() => queryInterface.renameColumn('Transactions', 'netAmountInGroupCurrency', 'netAmountInCollectiveCurrency'))
    .then(() => queryInterface.renameColumn('Tiers', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.changeColumn('Tiers', 'interval', {
      type: Sequelize.STRING(8),
      defaultValue: null
    }))
    .then(() => queryInterface.changeColumn('Subscriptions', 'interval', {
      type: Sequelize.STRING(8),
      defaultValue: null
    }))
    .then(() => queryInterface.renameColumn('Transactions', 'GroupId', 'CollectiveId'))
    .then(() => queryInterface.renameTable('UserGroups', 'Roles'))
    .then(() => queryInterface.renameColumn('Roles', 'GroupId', 'CollectiveId'))
    .then(() => createCollectivesForEvents(queryInterface.sequelize))
    .then(() => updateCollectives(queryInterface.sequelize))
    .then(() => createCollectivesForUsers(queryInterface.sequelize))
    .then(() => queryInterface.removeColumn('Tiers', 'EventId'))
    .then(() => queryInterface.removeColumn('Collectives', 'tiers'))
    .then(() => queryInterface.removeColumn('Collectives', 'logo'))
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
    .then(() => queryInterface.addColumn('Groups', 'logo', { type: Sequelize.STRING }))
    .then(() => queryInterface.addColumn('Groups', 'tiers', { type: Sequelize.JSON }))
    .then(() => queryInterface.renameColumn('Users', 'image', 'avatar'))
    .then(() => queryInterface.renameColumn('Transactions', 'netAmountInCollectiveCurrency', 'netAmountInGroupCurrency'))
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

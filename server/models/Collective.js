/**
 * Dependencies.
 */
import _ from 'lodash';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import queries from '../lib/queries';
import { uniq } from 'lodash';
import types from '../constants/collectives';
import roles from '../constants/roles';
import {HOST_FEE_PERCENT} from '../constants/transactions';
import { appendTier } from '../lib/utils';
import activities from '../constants/activities';
import Promise from 'bluebird';
import { hasRole } from '../lib/auth';

const DEFAULT_BACKGROUND_IMG = `${config.host.website}/public/images/collectives/default-header-bg.jpg`;

const getDefaultSettings = (collective) => {
  return {
    style: {
      hero: { 
        cover: { 
          transform: "scale(1.06)",
          backgroundImage: `url(${collective.backgroundImage || DEFAULT_BACKGROUND_IMG})`
        }, 
        a: {}
      }
    }    
  }
};

/**
 * Collective Model.
 * 
 * There 3 types of collective at the moment
 * - Collective
 * - User: Collective with only one ADMIN
 * - Event: Time based collective with a parent collective
 */
export default function(Sequelize, DataTypes) {

  const { models } = Sequelize;

  const Collective = Sequelize.define('Collective', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    type: {
      type: DataTypes.STRING, // COLLECTIVE, USER, EVENT
      defaultValue: "COLLECTIVE"
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
      set(slug) {
        if (slug && slug.toLowerCase) {
          this.setDataValue('slug', slug.toLowerCase().replace(/ /g, '-').replace(/\./g, ''));
        }
      }
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    LastEditedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: true // needs to be true because of old rows
    },

    ParentCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    HostId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    hostFeePercent: {
      type: DataTypes.FLOAT,
      defaultValue: HOST_FEE_PERCENT
    },

    mission: DataTypes.STRING, // max 95 characters
    description: DataTypes.STRING, // max 95 characters

    longDescription: DataTypes.TEXT,

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    image: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('image');
      }
    },

    backgroundImage: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('backgroundImage');
      }
    },

    // Max amount to raise across all tiers
    maxAmount: {
      type: DataTypes.INTEGER, // In cents
      min: 0
    },

    // Max quantity of tickets across all tiers
    maxQuantity: {
      type: DataTypes.INTEGER
    },

    locationName: DataTypes.STRING,

    address: DataTypes.STRING,

    geoLocationLatLong: DataTypes.GEOMETRY('POINT'),

    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        return deepmerge(getDefaultSettings(this), this.getDataValue('settings') || {});
      }
    },

    data: {
      type: DataTypes.JSON,
      allowNull: true
    },

    startsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    endsAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    timezone: DataTypes.TEXT,

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    twitterHandle: {
      type: DataTypes.STRING, // without the @ symbol. Ex: 'asood123'
      set(twitterHandle) {
        this.setDataValue('twitterHandle', twitterHandle.replace(/^@/,''));
      }
    },

    website: DataTypes.STRING,

    publicUrl: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING, ['slug']),
      get() {
        return `${config.host.website}/${this.get('slug')}`;
      }
    },

    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    isSupercollective: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    paranoid: true,

    getterMethods: {

      location() {
        return {
          name: this.locationName,
          address: this.address,
          lat: this.geoLocationLatLong && this.geoLocationLatLong.coordinates[0],
          long: this.geoLocationLatLong && this.geoLocationLatLong.coordinates[1]
        }
      },

      // Info.
      info() {
        return {
          id: this.id,
          name: this.name,
          mission: this.mission,
          description: this.description,
          longDescription: this.longDescription,
          budget: this.budget,
          burnrate: this.burnrate,
          currency: this.currency,
          image: this.image,
          data: this.data,
          backgroundImage: this.backgroundImage,
          maxAmount: this.maxAmount,
          maxQuantity: this.maxQuantity,
          locationName: this.locationName,
          address: this.address,
          geoLocationLatLong: this.geoLocationLatLong,
          startsAt: this.startsAt,
          endsAt: this.endsAt,
          timezone: this.timezone,
          status: this.status,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          isActive: this.isActive,
          slug: this.slug,
          tiers: this.tiers,
          settings: this.settings,
          website: this.website,
          twitterHandle: this.twitterHandle,
          publicUrl: this.publicUrl,
          hostFeePercent: this.hostFeePercent,
          tags: this.tags,
          HostId: this.HostId,
          isSupercollective: this.isSupercollective
        };
      },
      card() {
        return {
          id: this.id,
          createdAt: this.createdAt,
          name: this.name,
          slug: this.slug,
          image: this.image,
          backgroundImage: this.backgroundImage,
          publicUrl: this.publicUrl,
          mission: this.mission,
          settings: this.settings,
          currency: this.currency
        }
      },
      minimal() {
        return {
          id: this.id,
          name: this.name,
          image: this.image,
          slug: this.slug,
          publicUrl: this.publicUrl,
          mission: this.mission,
          isSupercollective: this.isSupercollective
        }
      }
    },

    instanceMethods: {
      getUsers() {
        return this.getResponses({ include: [{model: models.User }]})
          .then(rows => rows.map(r => r.User))
          .then(users => uniq(users, (user) => user.id));
      },

      getEvents() {
        return Collective.findAll({ where: { ParentCollectiveId: this.id, type: types.EVENT }});
      },

      canEdit(remoteUser) {
        if (remoteUser.id === this.CreatedByUserId) return Promise.resolve(true);
        else return hasRole(remoteUser.id, this.id, ['HOST', 'ADMIN']);
      },

      getUsersForViewer(viewer) {
        const promises = [queries.getUsersFromCollectiveWithTotalDonations(this.id)];
        if (viewer) {
          promises.push(viewer.canEditCollective(this.id));
        }
        return Promise.all(promises)
        .then(results => results[0].map(user => results[1] ? user.info : user.public))
      },

      getRoleForUser(user) {
        if (!user) return null;
        return models.Member.findOne({ UserId: user.id, CollectiveId: this.id }).then(ug => ug.role);
      },

      getSuperCollectiveCollectivesIds() {
        if (!this.isSupercollective) return Promise.resolve([this.id]);
        if (this.superCollectiveCollectivesIds) return Promise.resolve(this.superCollectiveCollectivesIds);
        return models.Collective.findAll({
          attributes: ['id'],
          where: {
            tags: { $contains: [this.settings.superCollectiveTag] }
          }
        })
        .then(rows => rows.map(r => r.id))
        .then(ids => {
          ids.push(this.id);
          this.superCollectiveCollectivesIds = ids;
          return ids;
        });
      },

      /**
       * returns the tiers with their users
       * e.g. collective.tiers = [
       *  { name: 'core contributor', users: [ {UserObject} ], range: [], ... },
       *  { name: 'backer', users: [ {UserObject}, {UserObject} ], range: [], ... }
       * ]
       */
      getTiersWithUsers(options = { active: false, attributes: ['id', 'username', 'image', 'firstDonation', 'lastDonation', 'totalDonations', 'website'] }) {
        const tiersById = {};

         // Get the list of tiers for the collective
        return models.Tier
          .findAll({ where: { CollectiveId: this.id, type: 'TIER' } })
          .then(tiers => tiers.map(t => {
            tiersById[t.id] = t;
          }))
          .then(() => queries.getUsersFromCollectiveWithTotalDonations(this.id, options.until))
          // Map the users to their respective tier
          .then(users => Promise.map(users, user => {
            const include = options.active ? [ { model: models.Subscription, attributes: ['isActive'] } ] : [];
            return models.Order.findOne({
              attributes: [ 'TierId' ],
              where: { CollectiveId: this.id, UserId: user.id },
              include
            }).then(order => {
              if (!order) {
                console.error("Collective.getTiersWithUsers: no order for ", { CollectiveId: this.id, UserId: user.id });
                return null;
              }
              if (!order.TierId) {
                console.error("Collective.getTiersWithUsers: no order.TierId for ", { CollectiveId: this.id, UserId: user.id });
                return null;
              }
              const TierId = order.TierId;
              tiersById[TierId] = tiersById[TierId] || order.Tier;
              tiersById[TierId].users = tiersById[TierId].users || [];
              if (options.active) {
                user.isActive = order.Subscription.isActive;
              }
              tiersById[TierId].users.push(user.dataValues);
            })
          }))
          .then(() => Object.values(tiersById));
      },

      /**
       * Get the Tier object of a user
       * @param {*} user 
       */
      getUserTier(user) {
        if (user.role && user.role !== 'BACKER') return user;
        return models.Order.findOne({
          where: { CollectiveId: this.id, UserId: user.id },
          include: [ { model: models.Tier, where: { type: 'TIER' } } ]
        }).then(order => order && order.Tier);
      },

      /**
       * Returns whether the backer is still active
       */
      isBackerActive(backer, until) {
        const where = { UserId: backer.id, CollectiveId: this.id };
        if (until) {
          where.createdAt = { $lt: until };
        }

        return models.Order
          .findOne({
            where,
            include: [ { model: models.Subscription, where: { isActive: true } } ]
          })
          .then(order => {
            if (!order) return false;
            if (!order.Subscription) return false;
            return order.Subscription.isActive;
          })
      },

      hasUserWithRole(userId, expectedMembers, cb) {
        this
          .getUsers({
            where: {
              id: userId
            }
          })
          .then(users => users.map(user => user.Member.role))
          .tap(actualMembers => cb(null, _.intersection(expectedMembers, actualMembers).length > 0))
          .catch(cb);
      },

      addUserWithRole(user, role) {
        const lists = {};
        lists[roles.BACKER] = 'backers';
        lists[roles.ADMIN] = 'admins';
        lists[roles.HOST] = 'host';

        const notifications = [{type:`mailinglist.${lists[role]}`}];

        switch (role) {
          case roles.HOST:
            notifications.push({type:activities.COLLECTIVE_TRANSACTION_CREATED});
            notifications.push({type:activities.COLLECTIVE_EXPENSE_CREATED});
            break;
          case roles.ADMIN:
            notifications.push({type:activities.COLLECTIVE_EXPENSE_CREATED});
            notifications.push({type:'collective.monthlyreport'});
            break;
        }

        return Promise.all([
          Sequelize.models.Member.create({ role, UserId: user.id, CollectiveId: this.id }),
          Sequelize.models.Notification.createMany(notifications, { UserId: user.id, CollectiveId: this.id, channel: 'email' })
        ]);
      },

      findOrAddUserWithRole(user, role) {
        return Sequelize.models.Member.find({
          where: {
            role,
            UserId: user.id,
            CollectiveId: this.id
          }})
        .then(Member => {
          if (!Member) {
            return this.addUserWithRole(user, role)
          } else {
            return Member;
          }
        });
      },

      getStripeAccount() {
        const CollectiveId = this.ParentCollectiveId || this.id;
        return Sequelize.models.Member.find({
          where: {
            CollectiveId,
            role: roles.HOST
          }
        })
        .then((Member) => {
          if (!Member) {
            return { stripeAccount: null };
          }
          return Sequelize.models.User.find({
            where: {
              id: Member.UserId
            },
            include: [{
              model: Sequelize.models.StripeAccount
            }]
          });
        })
        .then((host) => host.StripeAccount);
      },

      getConnectedAccount() {

        return models.Member.find({
          where: {
            CollectiveId: this.id,
            role: roles.HOST
          }
        })
        .then((Member) => {
          if (!Member) {
            return null;
          }

          return models.ConnectedAccount.find({
            where: {
              UserId: Member.UserId,
              provider: 'paypal',
            }
          });
        });
      },

      getExpenses(status, startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $lt: 0 },
          createdAt: { $lt: endDate },
          CollectiveId: this.id
        };
        if (status) where.status = status;
        if (startDate) where.createdAt.$gte = startDate;

        return models.Transaction.findAll({ where, order: [['createdAt','DESC']] });
      },

      getBalance(until) {
        until = until || new Date();
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total']
          ],
          where: {
            CollectiveId: this.id,
            createdAt: { $lt: until }
          }
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getYearlyIncome() {
        /*
          Three cases:
          1) All active monthly subscriptions. Multiply by 12
          2) All one-time and yearly subscriptions
          3) All inactive monthly subscriptions that have contributed in the past
        */
        return Sequelize.query(`
          WITH "activeMonthlySubscriptions" as (
            SELECT DISTINCT d."SubscriptionId", t."netAmountInCollectiveCurrency"
            FROM "Transactions" t
            LEFT JOIN "Orders" d ON d.id = t."OrderId"
            LEFT JOIN "Subscriptions" s ON s.id = d."SubscriptionId"
            WHERE t."CollectiveId"=:CollectiveId
              AND s."isActive" IS TRUE
              AND s.interval = 'month'
              AND s."deletedAt" IS NULL
          )
          SELECT
            (SELECT
              COALESCE(SUM("netAmountInCollectiveCurrency"*12),0) FROM "activeMonthlySubscriptions")
            +
            (SELECT
              COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Orders" d ON t."OrderId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."CollectiveId" = :CollectiveId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
            +
            (SELECT
              COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Orders" d ON t."OrderId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."CollectiveId" = :CollectiveId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND s.interval = 'month' AND s."isActive" IS FALSE AND s."deletedAt" IS NULL)
            "yearlyIncome"
          `.replace(/\s\s+/g, ' '), // this is to remove the new lines and save log space.
          {
            replacements: { CollectiveId: this.id },
            type: Sequelize.QueryTypes.SELECT
          })
          .then(result => Promise.resolve(parseInt(result[0].yearlyIncome,10)));
      },


      getTotalDonations(startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $gt: 0 },
          createdAt: { $lt: endDate },
          CollectiveId: this.id
        };
        if (startDate) where.createdAt.$gte = startDate;
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'total']
          ],
          where
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getTotalTransactions(startDate, endDate, type) {
        endDate = endDate || new Date;
        const where = {
          createdAt: { $lt: endDate },
          CollectiveId: this.id
        };
        if (startDate) where.createdAt.$gte = startDate;
        if (type === 'donation') where.amount = { $gt: 0 };
        if (type === 'expense') where.amount = { $lt: 0 };
        return models.Transaction.find({
          attributes: [
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('netAmountInCollectiveCurrency')), 0), 'total']
          ],
          where
        })
        .then(result => Promise.resolve(parseInt(result.toJSON().total, 10)));
      },

      getBackersCount(until) {
        until = until || new Date;

        return models.Transaction.find({
            attributes: [
              [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('UserId'))), 'backersCount']
            ],
            where: {
              CollectiveId: this.id,
              amount: {
                $gt: 0
              },
              createdAt: { $lt: until }
            }
          })
        .then((result) => {
          const json = result.toJSON();
          return Promise.resolve(Number(json.backersCount));
        });
      },

      getTwitterSettings() {
        const settings = this.settings || {};
        settings.twitter = settings.twitter || {};
        const defaults = {
          // thank you message immediately when receiving donation
          thankDonation: '$backer thanks for backing us!',

          // thank you message to all backers on 1st day of the month
          monthlyThankDonationsEnabled: false,
          monthlyThankDonationsSingular: 'Thank you $backer for supporting our collective',
          monthlyThankDonationsPlural: 'Thanks to our $backerCount backers and sponsors $backerList for supporting our collective'
        };

        return isThankDonationEnabled(this.id)
          .then(thankDonationEnabled => {
            settings.twitter.thankDonationEnabled = thankDonationEnabled;
            _.defaults(settings.twitter, defaults);
            return settings.twitter;
          });
      },

      getRelatedCollectives(limit=3, minTotalDonationInCents=10000, orderBy, orderDir) {
        return Collective.getCollectivesSummaryByTag(this.tags, limit, [this.id], minTotalDonationInCents, true, orderBy, orderDir);
      },

      getHost() {
        return models.User.findOne({
          include: [
            { model: models.Member, where: { role: roles.HOST, CollectiveId: this.id } }
          ]
        });
      },

      hasHost() {
        return this.getHost()
        .then(user => Promise.resolve(Boolean(user)));
      },

      getSuperCollectiveData() {
        if (this.isSupercollective &&
          this.settings.superCollectiveTag &&
          this.settings.superCollectiveTag.length > 0) {
          return Collective.getCollectivesSummaryByTag(this.settings.superCollectiveTag, 10000, [this.id], 0, false);
        }
        return Promise.resolve();
      }
    },

    classMethods: {
      createMany: (collectives, defaultValues) => {
        return Promise.map(collectives, u => Collective.create(_.defaults({},u,defaultValues)), {concurrency: 1}).catch(console.error);
      },

      findBySlug: (slug, options = {}) => {
        return Collective.findOne({ where: { slug: slug.toLowerCase() }, ...options })
          .then(collective => {
            if (!collective) {
              throw new Error(`No collective found with slug ${slug}`)
            }
            return collective;
          })
      },

      getCollectivesSummaryByTag: (tags, limit=3, excludeList=[], minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
        return queries.getCollectivesByTag(tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset)
          .then(collectives => {
            return Promise.all(collectives.map(collective => {

              return Promise.all([
                  collective.getYearlyIncome(),
                  queries
                    .getUsersFromCollectiveWithTotalDonations(collective.id)
                    .then(users => appendTier(collective, users))
                ])
                .then(results => {
                  const usersByRole = {};
                  const users = results[1];
                  users.map(user => {
                    usersByRole[user.dataValues.role] = usersByRole[user.dataValues.role] || [];
                    usersByRole[user.dataValues.role].push(user);
                  })
                  const collectiveInfo = collective.card;
                  collectiveInfo.yearlyIncome = results[0];
                  const backers = usersByRole[roles.BACKER] || [];
                  collectiveInfo.backersAndSponsorsCount = backers.length;
                  collectiveInfo.membersCount = (usersByRole[roles.ADMIN] || []).length;
                  collectiveInfo.sponsorsCount = backers.filter((b) => b.tier && b.tier.class === 'sponsor').length;
                  collectiveInfo.backersCount = collectiveInfo.backersAndSponsorsCount - collectiveInfo.sponsorsCount;
                  collectiveInfo.githubContributorsCount = (collective.data && collective.data.githubContributors) ? Object.keys(collective.data.githubContributors).length : 0;
                  collectiveInfo.contributorsCount = collectiveInfo.membersCount + collectiveInfo.githubContributorsCount + collectiveInfo.backersAndSponsorsCount;
                  return collectiveInfo;
                });
            }));
          })
      }
    }
  });
  Temporal(Collective, Sequelize);
  return Collective;

  function isThankDonationEnabled(CollectiveId) {
    return models.Notification.findOne({where: {
      channel: 'twitter',
      type: activities.COLLECTIVE_TRANSACTION_CREATED,
      CollectiveId,
      active: true
    }}).then(n => !!n);
  }
}

/**
 * Dependencies.
 */
import _ from 'lodash';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import queries from '../lib/queries';
import groupBy from 'lodash/collection/groupBy';
import roles from '../constants/roles';
import {HOST_FEE_PERCENT} from '../constants/transactions';
import {getTier } from '../lib/utils';
import activities from '../constants/activities';
import Promise from 'bluebird';

const DEFAULT_LOGO = '/public/images/1px.png';
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
      type: DataTypes.STRING // COLLECTIVE, USER, EVENT
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
        return this.getDataValue('image') || `${config.host.website}${DEFAULT_LOGO}`;
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
          expensePolicy: this.expensePolicy,
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
        return models.Role.findOne({ UserId: user.id, CollectiveId: this.id }).then(ug => ug.role);
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

        const addIsActive = (user, response) => {
          if (options.active) {
            return models.Donation.findOne({
              where: { CollectiveId: this.id, UserId: user.id, TierId: response.TierId },
              include: [ { model: models.Subscription, attributes: ['isActive'] } ]
            })
            .then(donation => {
              user.isActive = donation.Subscription.isActive;
              return user;
            })
          } else {
            return user;
          }
        }

        return queries.getUsersFromCollectiveWithTotalDonations(this.id, options.until)
          .tap(() => {
            models.Tier.findAll({where: { CollectiveId: this.id }})
            .then(tiers => tiers.map(t => {
              tiersById[t.id] = t;
            }));
          })
          .then(users => Promise.map(users, user => {
            return models.Response.findOne({
              attributes: [ 'TierId' ],
              where: { CollectiveId: this.id, UserId: user.id }
            }).then(response => {
              if (!response) {
                console.log(">>> no response for ", { CollectiveId: this.id, UserId: user.id });
              }
              const TierId = response.TierId;
              tiersById[TierId] = tiersById[TierId] || response.Tier;
              tiersById[TierId].users = tiersById[TierId].users || [];
              return addIsActive(user, response).then(user => {
                tiersById[TierId].users.push(user);
              })
            })
          }))
          .then(() => Object.values(tiersById));
      },

      getUserTier(user) {
        if (user.role && user.role !== 'BACKER') return user;
        return models.Response.findOne({
          where: { CollectiveId: this.id, UserId: user.id },
          include: [ { model: models.Tier, where: { type: { $in: ['TIER', 'BACKER', 'SPONSOR'] } } } ]
        }).then(response => response && response.Tier);
      },

      /**
       * Returns whether the backer is still active
       */
      isBackerActive(backer, until) {
        const where = { UserId: backer.id, CollectiveId: this.id };
        if (until) {
          where.createdAt = { $lt: until };
        }

        return models.Donation
          .findOne({
            where,
            include: [ { model: models.Subscription, where: { isActive: true } } ]
          })
          .then(donation => {
            if (!donation) return false;
            if (!donation.Subscription) return false;
            return donation.Subscription.isActive;
          })
      },

      hasUserWithRole(userId, expectedRoles, cb) {
        this
          .getUsers({
            where: {
              id: userId
            }
          })
          .then(users => users.map(user => user.Role.role))
          .tap(actualRoles => cb(null, _.intersection(expectedRoles, actualRoles).length > 0))
          .catch(cb);
      },

      addUserWithRole(user, role) {
        const lists = {};
        lists[roles.BACKER] = 'backers';
        lists[roles.MEMBER] = 'members';
        lists[roles.HOST] = 'host';

        const notifications = [{type:`mailinglist.${lists[role]}`}];

        switch (role) {
          case roles.HOST:
            notifications.push({type:activities.GROUP_TRANSACTION_CREATED});
            notifications.push({type:activities.GROUP_EXPENSE_CREATED});
            break;
          case roles.MEMBER:
            notifications.push({type:activities.GROUP_EXPENSE_CREATED});
            notifications.push({type:'collective.monthlyreport'});
            break;
        }

        return Promise.all([
          Sequelize.models.Role.create({ role, UserId: user.id, CollectiveId: this.id }),
          Sequelize.models.Notification.createMany(notifications, { UserId: user.id, CollectiveId: this.id, channel: 'email' })
        ]);
      },

      findOrAddUserWithRole(user, role) {
        return Sequelize.models.Role.find({
          where: {
            role,
            UserId: user.id,
            CollectiveId: this.id
          }})
        .then(Role => {
          if (!Role) {
            return this.addUserWithRole(user, role)
          } else {
            return Role;
          }
        });
      },

      getStripeAccount() {
        return Sequelize.models.Role.find({
          where: {
            CollectiveId: this.id,
            role: roles.HOST
          }
        })
        .then((Role) => {
          if (!Role) {
            return { stripeAccount: null };
          }
          return Sequelize.models.User.find({
            where: {
              id: Role.UserId
            },
            include: [{
              model: Sequelize.models.StripeAccount
            }]
          });
        })
        .then((host) => host.StripeAccount);
      },

      getConnectedAccount() {

        return models.Role.find({
          where: {
            CollectiveId: this.id,
            role: roles.HOST
          }
        })
        .then((Role) => {
          if (!Role) {
            return null;
          }

          return models.ConnectedAccount.find({
            where: {
              UserId: Role.UserId,
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
            LEFT JOIN "Donations" d ON d.id = t."DonationId"
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
              LEFT JOIN "Donations" d ON t."DonationId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."CollectiveId" = :CollectiveId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
            +
            (SELECT
              COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Donations" d ON t."DonationId" = d.id
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
            { model: models.Role, where: { role: roles.HOST, CollectiveId: this.id } }
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

      getCollectivesSummaryByTag: (tags, limit=3, excludeList=[], minTotalDonationInCents, randomOrder, orderBy, orderDir, offset) => {
        return queries.getCollectivesByTag(tags, limit, excludeList, minTotalDonationInCents, randomOrder, orderBy, orderDir, offset)
          .then(collectives => {
            return Promise.all(collectives.map(collective => {
              const appendTier = backers => {
                backers = backers.map(backer => {
                  backer.tier = getTier(backer, collective.tiers);
                  return backer;
                });
                return backers;
              };

              return Promise.all([
                  collective.getYearlyIncome(),
                  queries.getUsersFromCollectiveWithTotalDonations(collective.id)
                    .then(appendTier)
                ])
                .then(results => {
                  const collectiveInfo = collective.card;
                  collectiveInfo.yearlyIncome = results[0];
                  const usersByRole = groupBy(results[1], 'role');
                  const backers = usersByRole[roles.BACKER] || [];
                  collectiveInfo.backersAndSponsorsCount = backers.length;
                  collectiveInfo.membersCount = (usersByRole[roles.MEMBER] || []).length;
                  collectiveInfo.sponsorsCount = backers.filter((b) => b.tier.match(/^sponsor/i)).length;
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
      type: activities.GROUP_TRANSACTION_CREATED,
      CollectiveId,
      active: true
    }}).then(n => !!n);
  }
}

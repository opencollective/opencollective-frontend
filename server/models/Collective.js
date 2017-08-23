/**
 * Dependencies.
 */
import _ from 'lodash';
import Temporal from 'sequelize-temporal';
import config from 'config';
import deepmerge from 'deepmerge';
import queries from '../lib/queries';
import { difference, uniq } from 'lodash';
import { types } from '../constants/collectives';
import roles from '../constants/roles';
import { HOST_FEE_PERCENT } from '../constants/transactions';
import { appendTier } from '../lib/utils';
import slugify from 'slug';
import activities from '../constants/activities';
import Promise from 'bluebird';
import { hasRole } from '../lib/auth';
import userlib from '../lib/userlib';

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

    name: DataTypes.STRING,

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

    HostCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
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

    image: DataTypes.STRING,

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

    timezone: DataTypes.STRING,

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
        if (typeof twitterHandle !== 'string') return;
        this.setDataValue('twitterHandle', twitterHandle.replace(/^@/,''));
      }
    },

    website: {
      type: DataTypes.STRING,
      get() {
        if (this.getDataValue('website')) return this.getDataValue('website');
        return (this.getDataValue('twitterHandle')) ? `https://twitter.com/${this.getDataValue('twitterHandle')}` : null;
      }
    },

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
          lat: this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[0],
          long: this.geoLocationLatLong && this.geoLocationLatLong.coordinates && this.geoLocationLatLong.coordinates[1]
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
          HostCollectiveId: this.HostCollectiveId,
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

      getUser() {
        if ([ types.USER, types.ORGANIZATION ].includes(this.type)) {
          return models.User.findOne({ where: { CollectiveId: this.id } });
        } else {
          return Promise.resolve(null);
        }
      },

      getUsers() {
        console.log(">>> Collective.getUsers", this.id);
        return models.Member.findAll({
          where: { CollectiveId: this.id },
          include: [
            { model: models.Collective, as: 'memberCollective' }
          ]
        })
        .tap(m => console.log("getUsers", m))
        .then(memberships => memberships.memberCollective)
        .map(memberCollective => memberCollective.getUser())
        .then(users => uniq(users, (user) => user.id));
      },

      getEvents() {
        return Collective.findAll({ where: { ParentCollectiveId: this.id, type: types.EVENT }});
      },

      getIncomingOrders(options) {
        const query = deepmerge({
          where: { ToCollectiveId: this.id }
        }, options);
        return models.Order.findAll(query);
      },

      canEdit(remoteUser) {
        if (remoteUser.id === this.CreatedByUserId) {
          return Promise.resolve(true);
        }
        if (this.type === types.COLLECTIVE) {
          return hasRole(remoteUser.id, this.id, ['HOST', 'ADMIN']);
        } else {
          return hasRole(remoteUser.id, this.ParentCollectiveId, ['HOST', 'ADMIN']);
        }
      },

      getUsersForViewer(viewer, options) {
        const promises = [];
        if (options) {
          options.include = options.include || [];
          options.where = options.where || {};
          options.where.CollectiveId = this.id;
          options.include.push({model: models.User });
          promises.push(models.Member.findAll(options).map(member => member.User));
        } else {
          promises.push(queries.getBackersOfCollectiveWithTotalDonations(this.id));
        }
        if (viewer) {
          promises.push(viewer.canEditCollective(this.id));
        }
        return Promise.all(promises)
        .then(results => results[0].map(user => results[1] ? user.info : user.public))
      },

      getRoleForMemberCollective(MemberCollectiveId) {
        if (!MemberCollectiveId) return null;
        return models.Member.findOne({ MemberCollectiveId: MemberCollectiveId, CollectiveId: this.id }).then(member => member.role);
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
          .then(() => queries.getBackersOfCollectiveWithTotalDonations(this.id, options.until))
          // Map the users to their respective tier
          .map(backerCollective => {
            const include = options.active ? [ { model: models.Subscription, attributes: ['isActive'] } ] : [];
            return models.Order.findOne({
              attributes: [ 'TierId' ],
              where: { FromCollectiveId: backerCollective.id, ToCollectiveId: this.id },
              include
            }).then(order => {
              if (!order) {
                console.error("Collective.getTiersWithUsers: no order for ", { FromCollectiveId: backerCollective.id, ToCollectiveId: this.id });
                return null;
              }
              if (!order.TierId) {
                console.error("Collective.getTiersWithUsers: no order.TierId for ", { FromCollectiveId: backerCollective.id, ToCollectiveId: this.id });
                return null;
              }
              const TierId = order.TierId;
              tiersById[TierId] = tiersById[TierId] || order.Tier;
              tiersById[TierId].users = tiersById[TierId].users || [];
              if (options.active) {
                backerCollective.isActive = order.Subscription.isActive;
              }
              tiersById[TierId].users.push(backerCollective.dataValues);
            })
          })
          .then(() => Object.values(tiersById));
      },

      /**
       * Get the Tier object of a user
       * @param {*} user 
       */
      getBackerTier(backerCollective) {
        if (backerCollective.role && backerCollective.role !== 'BACKER') return backerCollective;
        return models.Order.findOne({
          where: {
            FromCollectiveId: backerCollective.id,
            ToCollectiveId: this.id
          },
          include: [ { model: models.Tier, where: { type: 'TIER' } } ]
        }).then(order => order && order.Tier);
      },

      /**
       * Returns whether the backer is still active
       */
      isBackerActive(backerCollective, until) {
        const where = { FromCollectiveId: backerCollective.id, ToCollectiveId: this.id };
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

      addUserWithRole(user, role, defaultAttributes = {}) {
        const lists = {};
        lists[roles.BACKER] = 'backers';
        lists[roles.ADMIN] = 'admins';
        lists[roles.HOST] = 'host';

        const notifications = [ { type:`mailinglist.${lists[role]}` } ];

        switch (role) {
          case roles.HOST:
            notifications.push({ type:activities.COLLECTIVE_TRANSACTION_CREATED });
            notifications.push({ type:activities.COLLECTIVE_EXPENSE_CREATED });
            break;
          case roles.ADMIN:
            notifications.push({ type:activities.COLLECTIVE_EXPENSE_CREATED });
            notifications.push({ type:'collective.monthlyreport' });
            break;
        }

        const member = {
          role,
          CreatedByUserId: user.id,
          MemberCollectiveId: user.CollectiveId,
          CollectiveId: this.id,
          ... defaultAttributes
        };

        return Promise.all([
          models.Member.create(member),
          models.Notification.createMany(notifications, { UserId: user.id, CollectiveId: this.id, channel: 'email' })
        ]).then(results => results[0]);
      },

      // Used when creating a transactin to add a user to the collective as a backer if needed
      findOrAddUserWithRole(user, role, defaultAttributes) {
        return models.Member.findOne({
          where: {
            role,
            CreatedByUserId: user.id,
            MemberCollectiveId: user.CollectiveId,
            CollectiveId: this.id
          }})
        .then(Member => {
          if (!Member) {
            return this.addUserWithRole(user, role, defaultAttributes)
          } else {
            return Member;
          }
        });
      },

      // edit the list of members and admins of this collective (create/update/remove)
      // creates a User and a UserCollective if needed
      editMembers(members, defaultAttributes = {}) {
        if (!members) return Promise.resolve();
        return this.getMembers({ where: { role: { $in: [ roles.ADMIN, roles.MEMBER ] } } } )
          .then(oldMembers => {
            // remove the members that are not present anymore
            const diff = difference(oldMembers.map(t => t.id), members.map(t => t.id));
            return models.Member.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
          })
          .then(() => {
            return Promise.map(members, (member) => {
              if (member.id) {
                // Edit an existing membership (e.g. edit the role)
                return models.Member.update(member, { where: { id: member.id }});
              } else {
                // Create new membership
                member.CollectiveId = this.id;
                if (member.CreatedByUserId) {
                  const user = {
                    id: member.CreatedByUserId,
                    CollectiveId: member.MemberCollectiveId
                  };
                  return this.addUserWithRole(user, member.role, { TierId: member.TierId, ...defaultAttributes });
                } else {
                  return models.User.findOrCreateByEmail(member.member.email, member.member)
                    .then(user => {
                      return this.addUserWithRole(user, member.role, { TierId: member.TierId, ...defaultAttributes });
                    })
                }
              }
            });
          })
          .then(() => this.getMembers({ where: { role: { $in: [ roles.ADMIN, roles.MEMBER ] } } } ))
      },

      // edit the tiers of this collective (create/update/remove)
      editTiers(tiers) {
        if (!tiers) return Promise.resolve();

        return this.getTiers()
        .then(oldTiers => {
          // remove the tiers that are not present anymore in the updated collective
          const diff = difference(oldTiers.map(t => t.id), tiers.map(t => t.id));
          return models.Tier.update({ deletedAt: new Date }, { where: { id: { $in: diff }}})
        })
        .then(() => {
          return Promise.map(tiers, (tier) => {
            if (tier.id) {
              return models.Tier.update(tier, { where: { id: tier.id }});
            } else {
              tier.CollectiveId = this.id;
              tier.currency = tier.currency || this.currency;
              return models.Tier.create(tier);  
            }
          });
        })
        .then(() => this.getTiers());
      },

      editPaymentMethods(paymentMethods, defaultAttributes = {}) {
        if (!paymentMethods) return Promise.resolve();
        return models.PaymentMethod.findAll({ where: { CollectiveId: this.id, archivedAt: { $eq: null } }})
        .then(oldPaymentMethods => {
          // remove the paymentMethods that are not present anymore in the updated collective
          const diff = difference(oldPaymentMethods.map(t => t.id), paymentMethods.map(t => t.id));
          return models.PaymentMethod.update({ archivedAt: new Date }, { where: { id: { $in: diff }}})
        })
        .then(() => {
          return Promise.map(paymentMethods, (pm) => {
            if (pm.id) {
              return models.PaymentMethod.update(pm, { where: { id: pm.id }});
            } else {
              pm.CollectiveId = this.id;
              models.PaymentMethod.update({ primary: false }, { where: { CollectiveId: this.id, archivedAt: { $eq: null } }});
              return models.PaymentMethod.createFromStripeSourceToken({ ...pm, ...defaultAttributes });
            }
          });
        })
      },

      getExpenses(status, startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $lt: 0 },
          createdAt: { $lt: endDate },
          ToCollectiveId: this.id
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
            ToCollectiveId: this.id,
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
            WHERE t."ToCollectiveId"=:CollectiveId
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
              WHERE t."ToCollectiveId" = :CollectiveId
                AND t.amount > 0
                AND t."deletedAt" IS NULL
                AND t."createdAt" > (current_date - INTERVAL '12 months')
                AND ((s.interval = 'year' AND s."isActive" IS TRUE AND s."deletedAt" IS NULL) OR s.interval IS NULL))
            +
            (SELECT
              COALESCE(SUM(t."netAmountInCollectiveCurrency"),0) FROM "Transactions" t
              LEFT JOIN "Orders" d ON t."OrderId" = d.id
              LEFT JOIN "Subscriptions" s ON d."SubscriptionId" = s.id
              WHERE t."ToCollectiveId" = :CollectiveId
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

      getTotalAmountReceived(startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $gt: 0 },
          createdAt: { $lt: endDate },
          ToCollectiveId: this.id
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

      // Get the total amount donated to other collectives
      getTotalAmountSent(startDate, endDate) {
        endDate = endDate || new Date;
        const where = {
          amount: { $gt: 0 },
          createdAt: { $lt: endDate },
          FromCollectiveId: this.id
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
          ToCollectiveId: this.id
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

      getLatestDonations(since, until, tags) {
        tags = tags || [];
        return models.Transaction.findAll({
          where: {
            FromCollectiveId: this.id,
            createdAt: { $gte: since || 0, $lt: until || new Date}
          },
          order: [ ['amount','DESC'] ],
          include: [ { model: models.Collective, as: 'toCollective', where: { tags: { $contains: tags } } } ]
        });
      },

      getBackersCount(until) {
        until = until || new Date;

        return models.Transaction.findOne({
            attributes: [
              [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('FromCollectiveId'))), 'backersCount']
            ],
            where: {
              ToCollectiveId: this.id,
              amount: {
                $gt: 0
              },
              createdAt: { $lt: until }
            }
          })
        .then((result) => {
          return Promise.resolve(Number(result.dataValues.backersCount));
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

      // get the host of the parent collective if any, or of this collective
      getHostCollective() {
        return models.Member.findOne({
          attributes: ['MemberCollectiveId'],
          where: { role: roles.HOST, CollectiveId: this.ParentCollectiveId || this.id },
          include: [ { model: models.Collective, as: 'memberCollective' } ]
        }).then(m => m && m.memberCollective);
      },

      getHostId() {
        return models.Member.findOne({
          attributes: ['MemberCollectiveId'],
          where: { role: roles.HOST, CollectiveId: this.ParentCollectiveId || this.id }
        }).then(member => member && member.MemberCollectiveId);
      },

      hasHost() {
        return this.getHostId().then(id => Promise.resolve(Boolean(id)));
      },

      getHostStripeAccount() {
        return this.getHostId()
          .then(id => id && models.ConnectedAccount.findOne({ where: { service: 'stripe', CollectiveId: id } }));
      },

      setStripeAccount(stripeAccount) {
        if (!stripeAccount) return Promise.resolve(null);

        if (stripeAccount.id) {
          return models.ConnectedAccount.update({ CollectiveId: this.id }, { where: { id: stripeAccount.id }, limit: 1});
        } else {
          return models.ConnectedAccount.create({
            service: 'stripe',
            ...stripeAccount,
            CollectiveId: this.id
          });
        }
      },

      getConnectedAccount() {

        return models.Member.find({
          attributes: ['CollectiveId'],
          where: {
            CollectiveId: this.id,
            role: roles.HOST
          }
        })
        .then((Member) => {
          if (!Member) {
            return null;
          }

          return models.ConnectedAccount.findOne({
            where: {
              CollectiveId: Member.CollectiveId,
              service: 'paypal'
            }
          });
        });
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

      getTopBackers(since, until, tags, limit) {
        return queries.getTopBackers(since || 0, until || new Date, tags, limit || 5);
      },

      /*
      * If there is a username suggested, we'll check that it's valid or increase it's count
      * Otherwise, we'll suggest something.
      */
      generateSlug(suggestions) {

        /*
        * Checks a given slug in a list and if found, increments count and recursively checks again
        */
        const slugSuggestionHelper = (slugToCheck, slugList, count) => {
          const slug = count > 0 ? `${slugToCheck}${count}` : slugToCheck;
          if (slugList.indexOf(slug) === -1) {
            return slug;
          } else {
            return slugSuggestionHelper(`${slugToCheck}`, slugList, count+1);
          }
        }

        suggestions = suggestions.filter(slug => slug ? true : false) // filter out any nulls
          .map(slug => slugify(slug.trim()).toLowerCase(/\./g,'')) // lowercase them all
          // remove any '+' signs
          .map(slug => slug.indexOf('+') !== -1 ? slug.substr(0, slug.indexOf('+')) : slug);

        // fetch any matching slugs or slugs for the top choice in the list above
        return Sequelize.query(`
            SELECT slug FROM "Collectives" where slug like '${suggestions[0]}%'
          `, {
            type: Sequelize.QueryTypes.SELECT
          })
        .then(userObjectList => userObjectList.map(user => user.slug))
        .then(slugList => slugSuggestionHelper(suggestions[0], slugList, 0));
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
                    .getBackersOfCollectiveWithTotalDonations(collective.id)
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
    },

    hooks: {
      beforeCreate: (instance) => {
        if (instance.slug) return Promise.resolve();

        const potentialSlugs = [
          instance.slug,
          instance.image ? userlib.getUsernameFromGithubURL(instance.image) : null,
          instance.twitterHandle ? instance.twitterHandle.replace(/@/g, '') : null,
          instance.name ? instance.name.replace(/ /g, '-') : null
        ];
        return Collective.generateSlug(potentialSlugs)
          .then(slug => {
            if (!slug) {
              return Promise.reject(new Error(`We couldn't generate a unique slug for this collective`, potentialSlugs));
            }
            instance.slug = slug;
            return Promise.resolve();
          });

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
